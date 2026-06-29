import type { Collaborator, ProximityScore, CollaboratorType, Orbit } from "@prisma/client"
import mockDataStatic from './mock-data-static.json'

// Pools de datos para generación realista
const FIRST_NAMES = [
  "María", "Carlos", "Ana", "José", "Laura", "Miguel", "Elena", "David", "Carmen", "Francisco",
  "Isabel", "Antonio", "Patricia", "Manuel", "Lucía", "Pedro", "Rosa", "Juan", "Teresa", "Javier",
  "Beatriz", "Rafael", "Silvia", "Fernando", "Monica", "Luis", "Cristina", "Jorge", "Pilar", "Andrés",
  "Mercedes", "Diego", "Alicia", "Pablo", "Victoria", "Raúl", "Gabriela", "Roberto", "Natalia", "Sergio",
  "Daniela", "Alberto", "Valeria", "Ricardo", "Adriana", "Alejandro", "Lorena", "Víctor", "Sofía", "Óscar"
]

const LAST_NAMES = [
  "García", "Fernández", "González", "Rodríguez", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín",
  "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Álvarez", "Muñoz", "Romero", "Alonso", "Navarro",
  "Torres", "Domínguez", "Vázquez", "Ramos", "Gil", "Ramírez", "Serrano", "Blanco", "Molina", "Castro",
  "Ortiz", "Rubio", "Marín", "Sanz", "Iglesias", "Núñez", "Medina", "Garrido", "Santos", "Cortés"
]

const COMPANIES = [
  "Tech Innova SL", "EcoGreen Solutions", "Educación Plus", "Salud Digital", "Arte y Cultura",
  "Sostenibilidad Global", "Innovación Social", "DataLab Analytics", "Green Energy Co", "Urban Design Studio",
  "Health & Wellness", "Creative Studio", "Smart Cities", "Bio Research", "Community Hub",
  "Digital Transform", "Impact Ventures", "Climate Action", "Youth Foundation", "Culture Lab",
  "AI Solutions", "Circular Economy", "Social Impact", "Clean Tech", "Design Thinking",
  "Open Source Collective", "Blockchain Labs", "Renewable Energy", "Public Policy", "EdTech Innovators"
]

const TAGS = [
  "tecnología", "sostenibilidad", "educación", "salud", "arte", "cultura",
  "innovación", "medioambiente", "comunidad", "diseño", "ciencia",
  "juventud", "emprendimiento", "digital", "bienestar"
]

const CITIES = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Murcia", "Palma",
  "Bilbao", "Alicante", "Córdoba", "Valladolid", "Granada", "Salamanca", "Toledo"
]

const COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Madrid": { lat: 40.4168, lng: -3.7038 },
  "Barcelona": { lat: 41.3851, lng: 2.1734 },
  "Valencia": { lat: 39.4699, lng: -0.3763 },
  "Sevilla": { lat: 37.3891, lng: -5.9845 },
  "Zaragoza": { lat: 41.6488, lng: -0.8891 }
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomItems<T>(array: T[], count: number): T[] {
  // Optimizado: en lugar de sort, seleccionar índices random
  const result: T[] = []
  const used = new Set<number>()

  while (result.length < count && result.length < array.length) {
    const index = Math.floor(Math.random() * array.length)
    if (!used.has(index)) {
      used.add(index)
      result.push(array[index])
    }
  }

  return result
}

// Mapa simple de caracteres acentuados (más rápido que normalize)
const ACCENT_MAP: Record<string, string> = {
  'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
  'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
  'ñ': 'n', 'Ñ': 'n'
}

function removeAccents(str: string): string {
  return str.split('').map(char => ACCENT_MAP[char] || char).join('')
}

function generateEmail(name: string, lastName: string, type: CollaboratorType): string {
  const cleanName = removeAccents(name).toLowerCase().replace(/\s+/g, '')
  const cleanLastName = removeAccents(lastName).toLowerCase().replace(/\s+/g, '')

  if (type === 'PERSON') {
    return `${cleanName}.${cleanLastName}@example.com`
  } else if (type === 'ORGANIZATION') {
    return `contact@${cleanLastName}.org`
  } else {
    return `info@proyecto-${cleanName}.com`
  }
}

function generatePhone(): string {
  const prefixes = ["+34 6", "+34 7", "+34 9"]
  const prefix = randomItem(prefixes)
  // Optimizado: concatenar directamente en lugar de Array.from
  let numbers = ''
  for (let i = 0; i < 8; i++) {
    numbers += Math.floor(Math.random() * 10)
  }
  return `${prefix}${numbers.slice(0, 2)} ${numbers.slice(2, 5)} ${numbers.slice(5)}`
}

function generateScoreForOrbit(orbit: Orbit): {
  scoreTotal: number
  scoreCollabActive: number
  scoreCollabPast: number
  scoreGeo: number
  scoreFrequency: number
  scoreAffinity: number
} {
  let scoreTotal: number

  // Distribuir según órbita
  if (orbit === 'CORE') {
    scoreTotal = Math.random() * 30 + 70 // 70-100
  } else if (orbit === 'MID') {
    scoreTotal = Math.random() * 29 + 40 // 40-69
  } else {
    scoreTotal = Math.random() * 40 // 0-39
  }

  // Distribuir scoreTotal entre componentes de forma realista
  const remaining = scoreTotal

  // Colaboración activa (0-30)
  const scoreCollabActive = Math.random() > 0.5
    ? Math.min(30, Math.random() * 30)
    : 0

  // Colaboración pasada (0-20)
  const scoreCollabPast = remaining - scoreCollabActive > 0 && Math.random() > 0.6
    ? Math.min(20, Math.random() * 20)
    : 0

  // Distribución proporcional del resto
  const leftover = Math.max(0, remaining - scoreCollabActive - scoreCollabPast)

  const scoreGeo = Math.min(20, leftover * (0.2 + Math.random() * 0.3)) // ~20-50% del resto
  const scoreFrequency = Math.min(15, leftover * (0.15 + Math.random() * 0.25)) // ~15-40% del resto
  const scoreAffinity = Math.max(0, leftover - scoreGeo - scoreFrequency)

  return {
    scoreTotal: parseFloat(scoreTotal.toFixed(1)),
    scoreCollabActive: parseFloat(scoreCollabActive.toFixed(1)),
    scoreCollabPast: parseFloat(scoreCollabPast.toFixed(1)),
    scoreGeo: parseFloat(scoreGeo.toFixed(1)),
    scoreFrequency: parseFloat(scoreFrequency.toFixed(1)),
    scoreAffinity: parseFloat(scoreAffinity.toFixed(1))
  }
}

export function generateMockCollaborators(orgId: string, count: number = 55): Collaborator[] {
  const collaborators: Collaborator[] = []
  const usedEmails = new Set<string>()

  // Determinar distribución de tipos
  const personCount = Math.floor(count * 0.7) // 70%
  const orgCount = Math.floor(count * 0.2) // 20%
  const projectCount = count - personCount - orgCount // resto

  const types: CollaboratorType[] = [
    ...Array(personCount).fill('PERSON'),
    ...Array(orgCount).fill('ORGANIZATION'),
    ...Array(projectCount).fill('PROJECT')
  ].sort(() => Math.random() - 0.5) as CollaboratorType[]

  for (let i = 0; i < count; i++) {
    const type = types[i]
    const firstName = randomItem(FIRST_NAMES)
    const lastName = randomItem(LAST_NAMES)

    let name: string
    if (type === 'PERSON') {
      name = `${firstName} ${lastName}`
    } else if (type === 'ORGANIZATION') {
      name = randomItem(COMPANIES)
    } else {
      name = `Proyecto ${firstName}`
    }

    let email = generateEmail(firstName, lastName, type)

    // Asegurar unicidad de emails
    let counter = 1
    while (usedEmails.has(email)) {
      email = generateEmail(`${firstName}${counter}`, lastName, type)
      counter++
    }
    usedEmails.add(email)

    const city = randomItem(CITIES)
    const coords = COORDINATES[city] || { lat: 40.4168, lng: -3.7038 }

    const collaborator: Collaborator = {
      id: `mock-collab-${i + 1}`,
      orgId,
      name,
      email,
      phone: Math.random() > 0.3 ? generatePhone() : null,
      address: `Calle ${randomItem(['Mayor', 'Principal', 'Real', 'Central'])} ${Math.floor(Math.random() * 100) + 1}`,
      city,
      country: "España",
      lat: coords.lat + (Math.random() - 0.5) * 0.1,
      lng: coords.lng + (Math.random() - 0.5) * 0.1,
      type,
      company: type === 'PERSON' ? (Math.random() > 0.4 ? randomItem(COMPANIES) : null) : null,
      tags: randomItems(TAGS, Math.floor(Math.random() * 4) + 1),
      notes: Math.random() > 0.7 ? `Colaborador ${type === 'PERSON' ? 'clave' : 'importante'} en varios proyectos` : null,
      collabActive: Math.random() > 0.5,
      collabPast: Math.random() > 0.6,
      contactFrequency: Math.floor(Math.random() * 6), // 0-5
      isArchived: false,
      photoUrl: null,
      extra: null,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // último año
      updatedAt: new Date()
    }

    collaborators.push(collaborator)
  }

  return collaborators
}

export function generateMockProximityScores(
  collaborators: Collaborator[],
  orgId: string
): ProximityScore[] {
  const totalCount = collaborators.length

  // Determinar distribución de órbitas
  const coreCount = Math.floor(totalCount * 0.2) // 20%
  const midCount = Math.floor(totalCount * 0.5) // 50%
  const peripheryCount = totalCount - coreCount - midCount // resto

  const orbits: Orbit[] = [
    ...Array(coreCount).fill('CORE'),
    ...Array(midCount).fill('MID'),
    ...Array(peripheryCount).fill('PERIPHERY')
  ].sort(() => Math.random() - 0.5) as Orbit[]

  return collaborators.map((collab, index) => {
    const orbit = orbits[index]
    const scores = generateScoreForOrbit(orbit)

    return {
      id: `mock-score-${index + 1}`,
      orgId,
      collaboratorId: collab.id,
      ...scores,
      orbit,
      calculatedAt: new Date()
    }
  })
}

// Importar datos estáticos pre-generados (mucho más rápido que generarlos dinámicamente)
export function getMockGraphData(orgId: string) {
  // Usar datos estáticos con las fechas convertidas a objetos Date
  const collaborators = mockDataStatic.collaborators.map(c => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt)
  })) as Collaborator[]

  const proximityScores = mockDataStatic.proximityScores.map(s => ({
    ...s,
    calculatedAt: new Date(s.calculatedAt)
  })) as ProximityScore[]

  return {
    collaborators,
    proximityScores
  }
}

// Mantener la función generadora por si se necesita en el futuro
export function generateMockGraphData(orgId: string, count: number = 55) {
  const collaborators = generateMockCollaborators(orgId, count)
  const proximityScores = generateMockProximityScores(collaborators, orgId)

  return {
    collaborators,
    proximityScores
  }
}
