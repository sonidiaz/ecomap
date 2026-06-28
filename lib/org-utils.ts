import { cookies } from 'next/headers'
import { OrgRole } from '@prisma/client'

const ORG_COOKIE_NAME = 'currentOrgSlug'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function getCurrentOrgSlug(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(ORG_COOKIE_NAME)?.value
}

export async function setCurrentOrgSlug(slug: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ORG_COOKIE_NAME, slug, {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
  })
}

export async function clearCurrentOrgSlug(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ORG_COOKIE_NAME)
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
