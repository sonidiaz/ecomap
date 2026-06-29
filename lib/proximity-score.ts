import { calculateDistance } from './geocoding'
import type { Orbit } from '@prisma/client'

interface ScoreInput {
  // Colaboración
  collabActive: boolean
  collabPast: boolean
  contactFrequency: number // 0-5

  // Geográfico
  orgLat?: number
  orgLng?: number
  collabLat?: number
  collabLng?: number

  // Afinidad
  orgTags: string[]
  collabTags: string[]
}

interface ProximityScoreResult {
  scoreTotal: number
  scoreCollabActive: number
  scoreCollabPast: number
  scoreGeo: number
  scoreFrequency: number
  scoreAffinity: number
  orbit: Orbit
}

/**
 * Calcula el score de proximidad completo para un colaborador
 */
export function calculateProximityScore(input: ScoreInput): ProximityScoreResult {
  // 1. Colaboración activa (0-30 puntos)
  const scoreCollabActive = input.collabActive ? 30 : 0

  // 2. Colaboración pasada (0-20 puntos)
  const scoreCollabPast = input.collabPast ? 20 : 0

  // 3. Proximidad geográfica (0-20 puntos)
  const scoreGeo = calculateGeoScore(
    input.orgLat,
    input.orgLng,
    input.collabLat,
    input.collabLng
  )

  // 4. Frecuencia de contacto (0-15 puntos)
  const scoreFrequency = (input.contactFrequency / 5) * 15

  // 5. Afinidad temática (0-15 puntos)
  const scoreAffinity = calculateAffinityScore(input.orgTags, input.collabTags)

  // Score total
  const scoreTotal =
    scoreCollabActive +
    scoreCollabPast +
    scoreGeo +
    scoreFrequency +
    scoreAffinity

  // Determinar órbita
  const orbit = determineOrbit(scoreTotal)

  return {
    scoreTotal,
    scoreCollabActive,
    scoreCollabPast,
    scoreGeo,
    scoreFrequency,
    scoreAffinity,
    orbit,
  }
}

/**
 * Calcula score geográfico basado en distancia
 * - 0 km = 20 puntos (100%)
 * - 100 km = 15 puntos (75%)
 * - 250 km = 10 puntos (50%)
 * - 500 km = 5 puntos (25%)
 * - >500 km = 0 puntos (0%)
 */
function calculateGeoScore(
  orgLat?: number,
  orgLng?: number,
  collabLat?: number,
  collabLng?: number
): number {
  // Si falta alguna coordenada, score neutro
  if (!orgLat || !orgLng || !collabLat || !collabLng) {
    return 10 // Score medio por defecto
  }

  const distanceKm = calculateDistance(orgLat, orgLng, collabLat, collabLng)

  // Escala inversa: menor distancia = mayor score
  if (distanceKm <= 50) return 20
  if (distanceKm <= 100) return 15
  if (distanceKm <= 250) return 10
  if (distanceKm <= 500) return 5
  return 0
}

/**
 * Calcula afinidad temática basada en tags compartidos
 * - 0% tags compartidos = 0 puntos
 * - 50% tags compartidos = 7.5 puntos
 * - 100% tags compartidos = 15 puntos
 */
function calculateAffinityScore(orgTags: string[], collabTags: string[]): number {
  // Si alguna de las listas está vacía, score neutro
  if (orgTags.length === 0 || collabTags.length === 0) {
    return 7.5 // Score medio por defecto
  }

  // Normalizar tags a lowercase
  const orgTagsNorm = orgTags.map(t => t.toLowerCase().trim())
  const collabTagsNorm = collabTags.map(t => t.toLowerCase().trim())

  // Contar tags compartidos
  const sharedTags = collabTagsNorm.filter(tag => orgTagsNorm.includes(tag))

  // Calcular porcentaje de overlap (respecto al conjunto más pequeño)
  const minTags = Math.min(orgTagsNorm.length, collabTagsNorm.length)
  const overlapRatio = sharedTags.length / minTags

  return overlapRatio * 15
}

/**
 * Determina la órbita basada en el score total
 */
function determineOrbit(scoreTotal: number): Orbit {
  if (scoreTotal >= 70) return 'CORE'
  if (scoreTotal >= 40) return 'MID'
  return 'PERIPHERY'
}
