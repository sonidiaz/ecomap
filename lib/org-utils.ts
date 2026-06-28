import { cookies } from 'next/headers'

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
