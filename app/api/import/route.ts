import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { geocodeAddress } from '@/lib/geocoding'
import { calculateProximityScore } from '@/lib/proximity-score'
import { parseWorkbook, parseRow, mapCollaboratorType } from '@/lib/import-service'

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener datos del form
    const formData = await req.formData()
    const file = formData.get('file') as File
    const orgId = formData.get('orgId') as string

    if (!file || !orgId) {
      return NextResponse.json(
        { error: 'Missing file or orgId' },
        { status: 400 }
      )
    }

    // Verificar permisos (ADMIN o EDITOR)
    const member = await prisma.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId: session.user.id,
        },
      },
    })

    if (!member || member.role === 'VIEWER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Obtener organización con sus coordenadas y tags
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, lat: true, lng: true, tags: true },
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Leer archivo Excel
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const rawData = parseWorkbook(buffer)

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: 'El archivo está vacío' },
        { status: 400 }
      )
    }

    // Procesar filas
    const results = {
      total: rawData.length,
      created: 0,
      updated: 0,
      warnings: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; error: string }>,
    }

    for (let i = 0; i < rawData.length; i++) {
      const parsed = parseRow(rawData[i], i)

      if (parsed.error || !parsed.data) {
        results.skipped++
        results.errors.push({ row: parsed.row, error: parsed.error || 'Fila inválida' })
        continue
      }

      const validatedRow = parsed.data

      try {
        // Colaborador existente (para decidir si es alta o actualización, y si hace falta re-geocodificar)
        const existing = await prisma.collaborator.findUnique({
          where: { orgId_email: { orgId: org.id, email: validatedRow.email } },
        })

        // Geocodificar solo si es nuevo o si la dirección cambió (evita quemar cuota de Google Places)
        let geoResult: Awaited<ReturnType<typeof geocodeAddress>> = null
        let addressWarning = false
        if (!existing || existing.address !== validatedRow.direccion) {
          geoResult = await geocodeAddress(validatedRow.direccion)
          if (!geoResult) addressWarning = true
        }

        const type = mapCollaboratorType(validatedRow.tipo)

        // Calcular proximity score
        const scoreResult = calculateProximityScore({
          collabActive: validatedRow.colaboracion_activa,
          collabPast: validatedRow.colaboracion_pasada,
          contactFrequency: validatedRow.frecuencia_contacto,
          orgLat: org.lat || undefined,
          orgLng: org.lng || undefined,
          collabLat: geoResult?.lat ?? existing?.lat ?? undefined,
          collabLng: geoResult?.lng ?? existing?.lng ?? undefined,
          orgTags: org.tags,
          collabTags: validatedRow.tags,
        })

        const baseData = {
          name: validatedRow.nombre,
          address: validatedRow.direccion,
          type,
          company: validatedRow.empresa,
          tags: validatedRow.tags,
          notes: validatedRow.notas,
          collabActive: validatedRow.colaboracion_activa,
          collabPast: validatedRow.colaboracion_pasada,
          contactFrequency: validatedRow.frecuencia_contacto,
          ...(geoResult
            ? { city: geoResult.city, country: geoResult.country, lat: geoResult.lat, lng: geoResult.lng }
            : {}),
        }

        // Crear o actualizar colaborador (upsert por email único = modo merge)
        const collaborator = await prisma.collaborator.upsert({
          where: { orgId_email: { orgId: org.id, email: validatedRow.email } },
          create: { orgId: org.id, email: validatedRow.email, ...baseData },
          update: { ...baseData, updatedAt: new Date() },
        })

        // Crear o actualizar score
        await prisma.proximityScore.upsert({
          where: {
            collaboratorId: collaborator.id,
          },
          create: {
            orgId: org.id,
            collaboratorId: collaborator.id,
            scoreTotal: scoreResult.scoreTotal,
            scoreCollabActive: scoreResult.scoreCollabActive,
            scoreCollabPast: scoreResult.scoreCollabPast,
            scoreGeo: scoreResult.scoreGeo,
            scoreFrequency: scoreResult.scoreFrequency,
            scoreAffinity: scoreResult.scoreAffinity,
            orbit: scoreResult.orbit,
          },
          update: {
            scoreTotal: scoreResult.scoreTotal,
            scoreCollabActive: scoreResult.scoreCollabActive,
            scoreCollabPast: scoreResult.scoreCollabPast,
            scoreGeo: scoreResult.scoreGeo,
            scoreFrequency: scoreResult.scoreFrequency,
            scoreAffinity: scoreResult.scoreAffinity,
            orbit: scoreResult.orbit,
            calculatedAt: new Date(),
          },
        })

        if (existing) {
          results.updated++
        } else {
          results.created++
        }
        if (addressWarning) results.warnings++
      } catch (error: any) {
        console.error(`Error processing row ${parsed.row}:`, error)
        results.skipped++
        results.errors.push({
          row: parsed.row,
          error: error.message || 'Error desconocido',
        })
      }
    }

    // Crear log de importación
    await prisma.importLog.create({
      data: {
        orgId: org.id,
        userId: session.user.id,
        filename: file.name,
        rowsTotal: results.total,
        rowsImported: results.created + results.updated,
        rowsSkipped: results.skipped,
        errorDetails: results.errors.length > 0 ? JSON.parse(JSON.stringify(results.errors)) : null,
      },
    })

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Error al procesar el archivo' },
      { status: 500 }
    )
  }
}
