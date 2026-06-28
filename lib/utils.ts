import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
