import * as XLSX from 'xlsx'
import type { Collaborator } from '@prisma/client'
import { excelRowSchema } from '@/lib/validations'

export interface ParsedRowData {
  nombre: string
  email: string
  direccion: string
  empresa?: string
  tipo?: string
  tags: string[]
  colaboracion_activa: boolean
  colaboracion_pasada: boolean
  frecuencia_contacto: number
  notas?: string
}

export interface ParsedRow {
  row: number
  data?: ParsedRowData
  error?: string
}

export function parseWorkbook(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(worksheet)
}

export function parseRow(row: any, index: number): ParsedRow {
  const rowIndex = index + 2 // +2 porque la fila 1 son headers

  try {
    const validated = excelRowSchema.parse({
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

    const tags = validated.tags
      ? validated.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    return {
      row: rowIndex,
      data: {
        nombre: validated.nombre,
        email: validated.email.toLowerCase().trim(),
        direccion: validated.direccion,
        empresa: validated.empresa,
        tipo: validated.tipo,
        tags,
        colaboracion_activa: validated.colaboracion_activa || false,
        colaboracion_pasada: validated.colaboracion_pasada || false,
        frecuencia_contacto: validated.frecuencia_contacto || 0,
        notas: validated.notas,
      },
    }
  } catch (error: any) {
    return {
      row: rowIndex,
      error: error.errors?.[0]?.message || error.message || 'Fila inválida',
    }
  }
}

export function mapCollaboratorType(tipo?: string): 'PERSON' | 'ORGANIZATION' | 'PROJECT' {
  if (!tipo) return 'PERSON'
  const normalized = tipo.toLowerCase().trim()
  if (normalized === 'organization' || normalized === 'organización') return 'ORGANIZATION'
  if (normalized === 'project' || normalized === 'proyecto') return 'PROJECT'
  return 'PERSON'
}

/** Compara los campos importables contra un colaborador existente. */
export function diffCollaborator(existing: Collaborator, data: ParsedRowData): string[] {
  const changes: string[] = []
  const type = mapCollaboratorType(data.tipo)

  if (existing.name !== data.nombre) changes.push('nombre')
  if ((existing.address || '') !== data.direccion) changes.push('dirección')
  if ((existing.company || '') !== (data.empresa || '')) changes.push('empresa')
  if (existing.type !== type) changes.push('tipo')
  if (JSON.stringify([...existing.tags].sort()) !== JSON.stringify([...data.tags].sort())) {
    changes.push('tags')
  }
  if (existing.collabActive !== data.colaboracion_activa) changes.push('colaboración activa')
  if (existing.collabPast !== data.colaboracion_pasada) changes.push('colaboración pasada')
  if (existing.contactFrequency !== data.frecuencia_contacto) changes.push('frecuencia de contacto')
  if ((existing.notes || '') !== (data.notas || '')) changes.push('notas')

  return changes
}

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
