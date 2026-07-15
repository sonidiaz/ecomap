import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseWorkbook, parseRow, diffCollaborator } from '@/lib/import-service'

type RowStatus = 'new' | 'updated' | 'unchanged' | 'duplicate' | 'error'

interface PreviewRow {
  row: number
  status: RowStatus
  name?: string
  email?: string
  changes?: string[]
  error?: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const orgId = formData.get('orgId') as string

    if (!file || !orgId) {
      return NextResponse.json({ error: 'Missing file or orgId' }, { status: 400 })
    }

    const member = await prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId: session.user.id } },
    })

    if (!member || member.role === 'VIEWER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const rawData = parseWorkbook(buffer)

    if (rawData.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    }

    const parsedRows = rawData.map((row, i) => parseRow(row, i))
    const validEmails = Array.from(
      new Set(parsedRows.filter((r) => r.data).map((r) => r.data!.email))
    )

    const existingCollaborators = await prisma.collaborator.findMany({
      where: { orgId, email: { in: validEmails } },
    })
    const existingByEmail = new Map(existingCollaborators.map((c) => [c.email, c]))

    const seenInFile = new Set<string>()
    const rows: PreviewRow[] = []

    for (const parsed of parsedRows) {
      if (parsed.error || !parsed.data) {
        rows.push({ row: parsed.row, status: 'error', error: parsed.error })
        continue
      }

      const { data } = parsed

      if (seenInFile.has(data.email)) {
        rows.push({
          row: parsed.row,
          status: 'duplicate',
          name: data.nombre,
          email: data.email,
          error: 'Email duplicado dentro del archivo',
        })
        continue
      }
      seenInFile.add(data.email)

      const existing = existingByEmail.get(data.email)
      if (!existing) {
        rows.push({ row: parsed.row, status: 'new', name: data.nombre, email: data.email })
        continue
      }

      const changes = diffCollaborator(existing, data)
      rows.push({
        row: parsed.row,
        status: changes.length > 0 ? 'updated' : 'unchanged',
        name: data.nombre,
        email: data.email,
        changes,
      })
    }

    const summary = {
      total: rows.length,
      new: rows.filter((r) => r.status === 'new').length,
      updated: rows.filter((r) => r.status === 'updated').length,
      unchanged: rows.filter((r) => r.status === 'unchanged').length,
      duplicates: rows.filter((r) => r.status === 'duplicate').length,
      errors: rows.filter((r) => r.status === 'error').length,
    }

    return NextResponse.json({ success: true, summary, rows })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json({ error: 'Error al analizar el archivo' }, { status: 500 })
  }
}
