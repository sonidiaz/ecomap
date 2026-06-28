import { Organization, Collaborator, ProximityScore, OrgMember, Orbit, User } from '@prisma/client'

export type OrganizationWithMembers = Organization & {
  members: (OrgMember & {
    user: {
      name: string | null
      email: string
    }
  })[]
}

export type CollaboratorWithScore = Collaborator & {
  proximityScores: ProximityScore | null
}

export interface ExcelRow {
  nombre: string
  email: string
  direccion: string
  empresa?: string
  tipo?: 'Person' | 'Organization' | 'Project'
  tags?: string
  colaboracion_activa?: boolean
  colaboracion_pasada?: boolean
  frecuencia_contacto?: number
  notas?: string
}

export interface ImportValidationResult {
  valid: ExcelRow[]
  warnings: Array<{ row: number; message: string; data: ExcelRow }>
  errors: Array<{ row: number; message: string; data: Partial<ExcelRow> }>
}

export interface ProximityCalculation {
  scoreTotal: number
  scoreCollabActive: number
  scoreCollabPast: number
  scoreGeo: number
  scoreFrequency: number
  scoreAffinity: number
  orbit: Orbit
}

export interface GeocodeResult {
  address: string
  city: string
  country: string
  lat: number
  lng: number
}
