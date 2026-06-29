import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { excelRowSchema } from '@/lib/validations'
import { geocodeAddress } from '@/lib/geocoding'
import { calculateProximityScore } from '@/lib/proximity-score'
import * as XLSX from 'xlsx'

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
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Leer primera hoja
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(worksheet)

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: 'El archivo está vacío' },
        { status: 400 }
      )
    }

    // Procesar filas
    const results = {
      total: rawData.length,
      imported: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; error: string }>,
    }

    for (let i = 0; i < rawData.length; i++) {
      const rowIndex = i + 2 // +2 porque la fila 1 son headers
      const row = rawData[i] as any

      try {
        // Validar fila con Zod
        const validatedRow = excelRowSchema.parse({
          nombre: row['nombre*'] || row['nombre'],
          email: row['email*'] || row['email'],
          direccion: row['direccion*'] || row['direccion'],
          empresa: row['empresa'] || undefined,
          tipo: row['tipo'] || undefined,
          tags: row['tags'] || undefined,
          colaboracion_activa: parseBoolean(row['colaboracion_activa']),
          colaboracion_pasada: parseBoolean(row['colaboracion_pasada']),
          frecuencia_contacto: parseNumber(row['frecuencia_contacto'], 0),
          notas: row['notas'] || undefined,
        })

        // Geocodificar dirección
        const geoResult = await geocodeAddress(validatedRow.direccion)

        // Parsear tags
        const tags = validatedRow.tags
          ? validatedRow.tags.split(',').map(t => t.trim()).filter(Boolean)
          : []

        // Mapear tipo
        const type = mapCollaboratorType(validatedRow.tipo)

        // Calcular proximity score
        const scoreResult = calculateProximityScore({
          collabActive: validatedRow.colaboracion_activa || false,
          collabPast: validatedRow.colaboracion_pasada || false,
          contactFrequency: validatedRow.frecuencia_contacto || 0,
          orgLat: org.lat || undefined,
          orgLng: org.lng || undefined,
          collabLat: geoResult?.lat,
          collabLng: geoResult?.lng,
          orgTags: org.tags,
          collabTags: tags,
        })

        // Crear o actualizar colaborador (upsert por email único)
        const collaborator = await prisma.collaborator.upsert({
          where: {
            orgId_email: {
              orgId: org.id,
              email: validatedRow.email,
            },
          },
          create: {
            orgId: org.id,
            name: validatedRow.nombre,
            email: validatedRow.email,
            address: validatedRow.direccion,
            city: geoResult?.city,
            country: geoResult?.country,
            lat: geoResult?.lat,
            lng: geoResult?.lng,
            type,
            company: validatedRow.empresa,
            tags,
            notes: validatedRow.notas,
            collabActive: validatedRow.colaboracion_activa || false,
            collabPast: validatedRow.colaboracion_pasada || false,
            contactFrequency: validatedRow.frecuencia_contacto || 0,
          },
          update: {
            name: validatedRow.nombre,
            address: validatedRow.direccion,
            city: geoResult?.city,
            country: geoResult?.country,
            lat: geoResult?.lat,
            lng: geoResult?.lng,
            type,
            company: validatedRow.empresa,
            tags,
            notes: validatedRow.notas,
            collabActive: validatedRow.colaboracion_activa || false,
            collabPast: validatedRow.colaboracion_pasada || false,
            contactFrequency: validatedRow.frecuencia_contacto || 0,
            updatedAt: new Date(),
          },
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

        results.imported++
      } catch (error: any) {
        console.error(`Error processing row ${rowIndex}:`, error)
        results.skipped++
        results.errors.push({
          row: rowIndex,
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
        rowsImported: results.imported,
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

// Helpers
function parseBoolean(value: any): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value
  const str = String(value).toLowerCase().trim()
  if (str === 'true' || str === '1' || str === 'yes' || str === 'si' || str === 'sí') return true
  if (str === 'false' || str === '0' || str === 'no') return false
  return undefined
}

function parseNumber(value: any, defaultValue: number): number {
  if (value === undefined || value === null || value === '') return defaultValue
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

function mapCollaboratorType(tipo?: string): 'PERSON' | 'ORGANIZATION' | 'PROJECT' {
  if (!tipo) return 'PERSON'
  const normalized = tipo.toLowerCase().trim()
  if (normalized === 'organization' || normalized === 'organización') return 'ORGANIZATION'
  if (normalized === 'project' || normalized === 'proyecto') return 'PROJECT'
  return 'PERSON'
}
