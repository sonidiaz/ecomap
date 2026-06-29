import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { OrgRole, Collaborator } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function parseExcelTags(tagsString?: string): string[] {
  if (!tagsString) return []
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

export function formatOrbit(orbit: string): string {
  const labels: Record<string, string> = {
    CORE: 'Core',
    MID: 'Mid',
    PERIPHERY: 'Periphery',
  }
  return labels[orbit] || orbit
}

export function getOrbitColor(orbit: string): string {
  const colors: Record<string, string> = {
    CORE: 'text-green-600 bg-green-50',
    MID: 'text-yellow-600 bg-yellow-50',
    PERIPHERY: 'text-gray-600 bg-gray-50',
  }
  return colors[orbit] || colors.PERIPHERY
}

export function getRoleBadgeColor(role: OrgRole): string {
  const colors = {
    ADMIN: 'bg-purple-100 text-purple-800',
    EDITOR: 'bg-blue-100 text-blue-800',
    VIEWER: 'bg-gray-100 text-gray-800',
  }
  return colors[role]
}

export function formatRole(role: OrgRole): string {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

// Helpers para el grafo de red
export function getNodeSize(scoreTotal: number): number {
  // Escala continua: mapear 0-100 a 35-75px
  const MIN_SIZE = 35
  const MAX_SIZE = 75
  return MIN_SIZE + (scoreTotal / 100) * (MAX_SIZE - MIN_SIZE)
}

export function findSimilarCollaborators(
  target: Collaborator,
  all: Collaborator[]
): Collaborator[] {
  // Filtrar por tags compartidos
  return all
    .filter(c =>
      c.id !== target.id &&
      c.tags.some(tag => target.tags.includes(tag))
    )
    .slice(0, 5) // Top 5
}
