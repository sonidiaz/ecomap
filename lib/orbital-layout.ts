import type { Collaborator, ProximityScore } from "@prisma/client"

/**
 * Calcula la posición orbital de un nodo basado en su score de proximidad
 */
export function calculateOrbitalPosition(
  scoreTotal: number,
  angle: number,
  centerX: number,
  centerY: number,
  minRadius: number = 120,
  maxRadius: number = 400
): { x: number; y: number; distance: number } {
  // Normalizar score a rango 0-1
  const normalizedScore = Math.max(0, Math.min(100, scoreTotal)) / 100

  // Calcular distancia (inversa: mayor score = más cerca)
  const distance = maxRadius - (normalizedScore * (maxRadius - minRadius))

  // Calcular posición cartesiana
  const x = centerX + Math.cos(angle) * distance
  const y = centerY + Math.sin(angle) * distance

  return { x, y, distance }
}

/**
 * Distribuye nodos orbitalmente alrededor del centro
 * basado en sus scores de proximidad
 */
export function distributeNodesOrbitally(
  collaborators: Collaborator[],
  proximityScores: ProximityScore[],
  center: { x: number; y: number } = { x: 500, y: 400 }
): Array<{ id: string; x: number; y: number; size: number; distance: number }> {
  // Crear mapa de scores por collaborator ID
  const scoresMap = new Map<string, ProximityScore>()
  proximityScores.forEach(score => {
    scoresMap.set(score.collaboratorId, score)
  })

  // Filtrar colaboradores que tienen score
  const collabsWithScores = collaborators
    .map(collab => ({
      collab,
      score: scoresMap.get(collab.id)
    }))
    .filter(item => item.score !== undefined) as Array<{
      collab: Collaborator
      score: ProximityScore
    }>

  // Ordenar por orbit (CORE → MID → PERIPHERY) y luego por score
  const orbitPriority = { CORE: 0, MID: 1, PERIPHERY: 2 }
  collabsWithScores.sort((a, b) => {
    const orbitDiff = orbitPriority[a.score.orbit] - orbitPriority[b.score.orbit]
    if (orbitDiff !== 0) return orbitDiff
    return b.score.scoreTotal - a.score.scoreTotal
  })

  // Agrupar por tag principal (tags[0]) para clustering semántico
  const tagGroups = new Map<string, typeof collabsWithScores>()
  collabsWithScores.forEach(item => {
    const primaryTag = item.collab.tags[0] || 'sin-tag'
    if (!tagGroups.has(primaryTag)) {
      tagGroups.set(primaryTag, [])
    }
    tagGroups.get(primaryTag)!.push(item)
  })

  // Distribuir grupos angularmente
  const positions: Array<{ id: string; x: number; y: number; size: number; distance: number }> = []
  let currentAngle = 0
  const anglePerNode = (2 * Math.PI) / collabsWithScores.length

  tagGroups.forEach(group => {
    // Calcular sector angular para este grupo
    const groupAngleSpan = anglePerNode * group.length

    group.forEach((item, index) => {
      // Ángulo base + pequeño jitter determinista (±5°), estable entre servidor y cliente
      const jitter = (seededRandom(item.collab.id) - 0.5) * (5 * Math.PI / 180)
      const angle = currentAngle + (anglePerNode * index) + jitter

      // Calcular tamaño primero
      const size = getNodeSize(item.score.scoreTotal)

      // Calcular posición orbital (centro del nodo)
      const { x, y, distance } = calculateOrbitalPosition(
        item.score.scoreTotal,
        angle,
        center.x,
        center.y
      )

      // Ajustar posición para que React Flow la interprete correctamente
      // React Flow posiciona por esquina superior izquierda, así que restamos la mitad del tamaño
      positions.push({
        id: item.collab.id,
        x: x - size / 2,
        y: y - size / 2,
        size,
        distance
      })
    })

    currentAngle += groupAngleSpan
  })

  return positions
}

/**
 * Calcula los radios de los anillos de órbita
 */
export function getOrbitRingRadii(
  center: { x: number; y: number },
  minRadius: number = 120,
  maxRadius: number = 400
): { core: number; midInner: number } {
  // CORE: score >= 70
  // MID: score 40-69
  // PERIPHERY: score < 40

  // Radio para límite CORE (score 70)
  const coreRadius = maxRadius - (0.70 * (maxRadius - minRadius))

  // Radio para límite MID (score 40)
  const midInnerRadius = maxRadius - (0.40 * (maxRadius - minRadius))

  return {
    core: coreRadius,      // ~232px
    midInner: midInnerRadius // ~280px
  }
}

/**
 * Genera un valor pseudo-aleatorio determinista en [0, 1) a partir de un id.
 * Evita usar Math.random() en el cálculo de layout, que se ejecuta tanto en
 * el render de servidor como en el de cliente y provocaría un hydration mismatch.
 */
function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return (hash >>> 0) / 0xffffffff
}

/**
 * Calcula el tamaño de nodo basado en score (escala continua)
 */
function getNodeSize(scoreTotal: number): number {
  const MIN_SIZE = 35
  const MAX_SIZE = 75
  return MIN_SIZE + (scoreTotal / 100) * (MAX_SIZE - MIN_SIZE)
}
