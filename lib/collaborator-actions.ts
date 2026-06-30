"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { collaboratorSchema } from "@/lib/validations"
import { geocodeAddress, calculateDistance } from "@/lib/geocoding"
import { calculateProximityScore } from "@/lib/proximity-score"
import type { CollaboratorType } from "@prisma/client"

/**
 * Get user's role in organization
 */
async function getUserRole(orgId: string, userId: string) {
  const membership = await prisma.orgMember.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId
      }
    }
  })
  return membership?.role || null
}

/**
 * Verify user has minimum required role
 */
async function requireRole(orgId: string, userId: string, minRole: 'VIEWER' | 'EDITOR' | 'ADMIN') {
  const role = await getUserRole(orgId, userId)
  if (!role) {
    throw new Error('No tienes acceso a esta organización')
  }

  const roleHierarchy = {
    VIEWER: 1,
    EDITOR: 2,
    ADMIN: 3
  }

  if (roleHierarchy[role] < roleHierarchy[minRole]) {
    throw new Error(`Se requiere rol ${minRole} o superior`)
  }

  return true
}

/**
 * Get all collaborators for an organization
 */
export async function getCollaborators(orgId: string, includeArchived = false) {
  const collaborators = await prisma.collaborator.findMany({
    where: {
      orgId,
      ...(includeArchived ? {} : { isArchived: false })
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return collaborators
}

/**
 * Get single collaborator by ID
 */
export async function getCollaborator(id: string) {
  const collaborator = await prisma.collaborator.findUnique({
    where: { id }
  })

  if (!collaborator) {
    throw new Error('Colaborador no encontrado')
  }

  return collaborator
}

/**
 * Get proximity score for collaborator
 */
export async function getProximityScore(collaboratorId: string) {
  const score = await prisma.proximityScore.findUnique({
    where: { collaboratorId }
  })

  return score
}

/**
 * Get all unique tags used in an organization
 */
export async function getAllTags(orgId: string) {
  const collaborators = await prisma.collaborator.findMany({
    where: { orgId },
    select: { tags: true }
  })

  const allTags = new Set<string>()
  collaborators.forEach(collab => {
    collab.tags.forEach(tag => allTags.add(tag))
  })

  return Array.from(allTags).sort()
}

/**
 * Get organization by slug
 */
export async function getOrgBySlug(slug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug }
  })

  if (!org) {
    throw new Error('Organización no encontrada')
  }

  return org
}

/**
 * Create new collaborator
 */
export async function createCollaborator(orgSlug: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get organization
  const org = await getOrgBySlug(orgSlug)

  // Check permissions (EDITOR or ADMIN)
  await requireRole(org.id, session.user.id, 'EDITOR')

  // Extract form data
  const name = formData.get('name') as string
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null
  const address = formData.get('address') as string | null
  const type = (formData.get('type') as CollaboratorType) || 'PERSON'
  const company = formData.get('company') as string | null
  const tagsString = formData.get('tags') as string | null
  const notes = formData.get('notes') as string | null
  const collabActive = formData.get('collabActive') === 'true'
  const collabPast = formData.get('collabPast') === 'true'
  const contactFrequency = parseInt(formData.get('contactFrequency') as string) || 0
  const photoUrl = formData.get('photoUrl') as string | null

  // Parse tags
  const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : []

  // Geocoding
  let lat = parseFloat(formData.get('lat') as string || '')
  let lng = parseFloat(formData.get('lng') as string || '')
  let city = formData.get('city') as string | null
  let country = formData.get('country') as string | null

  // If no lat/lng but address provided, try geocoding
  if (!lat && !lng && address) {
    const geocoded = await geocodeAddress(address)
    if (geocoded) {
      lat = geocoded.lat
      lng = geocoded.lng
      city = geocoded.city || city
      country = geocoded.country || country
    }
  }

  // Validate
  const validation = collaboratorSchema.safeParse({
    name,
    email: email || undefined,
    address: address || undefined,
    city: city || undefined,
    country: country || undefined,
    type,
    company: company || undefined,
    tags,
    notes: notes || undefined,
    collabActive,
    collabPast,
    contactFrequency
  })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // Check for duplicate email in same org
  if (email) {
    const existing = await prisma.collaborator.findUnique({
      where: {
        orgId_email: {
          orgId: org.id,
          email
        }
      }
    })

    if (existing) {
      return { error: 'Ya existe un colaborador con este email en tu organización' }
    }
  }

  // Create collaborator
  const collaborator = await prisma.collaborator.create({
    data: {
      orgId: org.id,
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country: country || null,
      lat: lat || null,
      lng: lng || null,
      type,
      company: company || null,
      tags,
      notes: notes || null,
      collabActive,
      collabPast,
      contactFrequency,
      photoUrl: photoUrl || null
    }
  })

  // Calculate proximity score
  await recalculateProximityScore(collaborator.id, org.id)

  revalidatePath(`/${orgSlug}/collaborators`)
  revalidatePath(`/${orgSlug}/graph`)

  return { success: true, collaboratorId: collaborator.id }
}

/**
 * Update existing collaborator
 */
export async function updateCollaborator(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get existing collaborator
  const existing = await prisma.collaborator.findUnique({
    where: { id },
    include: { org: true }
  })

  if (!existing) {
    return { error: 'Colaborador no encontrado' }
  }

  // Check permissions
  await requireRole(existing.orgId, session.user.id, 'EDITOR')

  // Extract form data (same as create)
  const name = formData.get('name') as string
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null
  const address = formData.get('address') as string | null
  const type = (formData.get('type') as CollaboratorType) || 'PERSON'
  const company = formData.get('company') as string | null
  const tagsString = formData.get('tags') as string | null
  const notes = formData.get('notes') as string | null
  const collabActive = formData.get('collabActive') === 'true'
  const collabPast = formData.get('collabPast') === 'true'
  const contactFrequency = parseInt(formData.get('contactFrequency') as string) || 0
  const photoUrl = formData.get('photoUrl') as string | null

  const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : []

  // Geocoding
  let lat = parseFloat(formData.get('lat') as string || '')
  let lng = parseFloat(formData.get('lng') as string || '')
  let city = formData.get('city') as string | null
  let country = formData.get('country') as string | null

  // If address changed and no lat/lng, try geocoding
  if (address && address !== existing.address && (!lat || !lng)) {
    const geocoded = await geocodeAddress(address)
    if (geocoded) {
      lat = geocoded.lat
      lng = geocoded.lng
      city = geocoded.city || city
      country = geocoded.country || country
    }
  }

  // Validate
  const validation = collaboratorSchema.safeParse({
    name,
    email: email || undefined,
    address: address || undefined,
    city: city || undefined,
    country: country || undefined,
    type,
    company: company || undefined,
    tags,
    notes: notes || undefined,
    collabActive,
    collabPast,
    contactFrequency
  })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // Check duplicate email (if changed)
  if (email && email !== existing.email) {
    const duplicate = await prisma.collaborator.findUnique({
      where: {
        orgId_email: {
          orgId: existing.orgId,
          email
        }
      }
    })

    if (duplicate && duplicate.id !== id) {
      return { error: 'Ya existe otro colaborador con este email' }
    }
  }

  // Update collaborator
  const updated = await prisma.collaborator.update({
    where: { id },
    data: {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country: country || null,
      lat: lat || null,
      lng: lng || null,
      type,
      company: company || null,
      tags,
      notes: notes || null,
      collabActive,
      collabPast,
      contactFrequency,
      photoUrl: photoUrl || null
    }
  })

  // Check if score-affecting fields changed
  const needsRecalc =
    existing.lat !== updated.lat ||
    existing.lng !== updated.lng ||
    existing.collabActive !== updated.collabActive ||
    existing.collabPast !== updated.collabPast ||
    existing.contactFrequency !== updated.contactFrequency ||
    JSON.stringify(existing.tags.sort()) !== JSON.stringify(updated.tags.sort())

  if (needsRecalc) {
    await recalculateProximityScore(id, existing.orgId)
  }

  revalidatePath(`/${existing.org.slug}/collaborators`)
  revalidatePath(`/${existing.org.slug}/collaborators/${id}`)
  revalidatePath(`/${existing.org.slug}/graph`)

  return { success: true }
}

/**
 * Archive collaborator (soft delete)
 */
export async function archiveCollaborator(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const collaborator = await prisma.collaborator.findUnique({
    where: { id },
    include: { org: true }
  })

  if (!collaborator) {
    return { error: 'Colaborador no encontrado' }
  }

  // Check permissions
  await requireRole(collaborator.orgId, session.user.id, 'EDITOR')

  // Archive
  await prisma.collaborator.update({
    where: { id },
    data: { isArchived: true }
  })

  revalidatePath(`/${collaborator.org.slug}/collaborators`)
  revalidatePath(`/${collaborator.org.slug}/graph`)

  return { success: true }
}

/**
 * Unarchive collaborator
 */
export async function unarchiveCollaborator(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const collaborator = await prisma.collaborator.findUnique({
    where: { id },
    include: { org: true }
  })

  if (!collaborator) {
    return { error: 'Colaborador no encontrado' }
  }

  // Check permissions
  await requireRole(collaborator.orgId, session.user.id, 'EDITOR')

  // Unarchive
  await prisma.collaborator.update({
    where: { id },
    data: { isArchived: false }
  })

  revalidatePath(`/${collaborator.org.slug}/collaborators`)
  revalidatePath(`/${collaborator.org.slug}/collaborators/archived`)
  revalidatePath(`/${collaborator.org.slug}/graph`)

  return { success: true }
}

/**
 * Delete collaborator permanently (ADMIN only)
 */
export async function deleteCollaborator(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const collaborator = await prisma.collaborator.findUnique({
    where: { id },
    include: { org: true }
  })

  if (!collaborator) {
    return { error: 'Colaborador no encontrado' }
  }

  // Check permissions (ADMIN only)
  await requireRole(collaborator.orgId, session.user.id, 'ADMIN')

  // Delete (cascade will delete proximity scores)
  await prisma.collaborator.delete({
    where: { id }
  })

  revalidatePath(`/${collaborator.org.slug}/collaborators`)
  revalidatePath(`/${collaborator.org.slug}/graph`)

  return { success: true }
}

/**
 * Recalculate proximity score for a collaborator
 */
async function recalculateProximityScore(collaboratorId: string, orgId: string) {
  const [collaborator, org] = await Promise.all([
    prisma.collaborator.findUnique({ where: { id: collaboratorId } }),
    prisma.organization.findUnique({ where: { id: orgId } })
  ])

  if (!collaborator || !org) return

  const scoreResult = calculateProximityScore({
    collabActive: collaborator.collabActive,
    collabPast: collaborator.collabPast,
    contactFrequency: collaborator.contactFrequency,
    orgLat: org.lat ?? undefined,
    orgLng: org.lng ?? undefined,
    collabLat: collaborator.lat ?? undefined,
    collabLng: collaborator.lng ?? undefined,
    orgTags: org.tags,
    collabTags: collaborator.tags,
  })

  await prisma.proximityScore.upsert({
    where: { collaboratorId },
    create: {
      orgId,
      collaboratorId,
      ...scoreResult
    },
    update: {
      ...scoreResult,
      calculatedAt: new Date()
    }
  })
}
