"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { orgMemberSchema } from "@/lib/validations"
import type { OrgRole } from "@prisma/client"

export async function inviteMember(orgSlug: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get organization
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      members: {
        where: { userId: session.user.id }
      }
    }
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  // Check if user is ADMIN
  const membership = org.members[0]
  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Only admins can invite members')
  }

  // Validate input
  const email = formData.get('email') as string
  const role = formData.get('role') as OrgRole

  const validation = orgMemberSchema.safeParse({ email, role })
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  // Check if user exists
  const userToInvite = await prisma.user.findUnique({
    where: { email }
  })

  if (!userToInvite) {
    throw new Error('User not found. They must sign up first.')
  }

  // Check if already a member
  const existingMember = await prisma.orgMember.findUnique({
    where: {
      orgId_userId: {
        orgId: org.id,
        userId: userToInvite.id
      }
    }
  })

  if (existingMember) {
    throw new Error('User is already a member of this organization')
  }

  // Create membership
  await prisma.orgMember.create({
    data: {
      orgId: org.id,
      userId: userToInvite.id,
      role
    }
  })

  revalidatePath(`/${orgSlug}/settings/members`)
  return { success: true }
}

export async function updateMemberRole(
  orgSlug: string,
  memberId: string,
  newRole: OrgRole
) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get organization
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      members: {
        where: { userId: session.user.id }
      }
    }
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  // Check if user is ADMIN
  const membership = org.members[0]
  if (!membership || membership.role !== 'ADMIN') {
    throw new Error('Only admins can update member roles')
  }

  // Update role
  await prisma.orgMember.update({
    where: { id: memberId },
    data: { role: newRole }
  })

  revalidatePath(`/${orgSlug}/settings/members`)
  return { success: true }
}

export async function removeMember(orgSlug: string, memberId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get organization with all members
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      members: true
    }
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  // Check if user is ADMIN
  const currentUserMembership = org.members.find(m => m.userId === session.user.id)
  if (!currentUserMembership || currentUserMembership.role !== 'ADMIN') {
    throw new Error('Only admins can remove members')
  }

  // Get member to remove
  const memberToRemove = org.members.find(m => m.id === memberId)
  if (!memberToRemove) {
    throw new Error('Member not found')
  }

  // Prevent removing yourself if you're the last ADMIN
  if (memberToRemove.userId === session.user.id) {
    const adminCount = org.members.filter(m => m.role === 'ADMIN').length
    if (adminCount === 1) {
      throw new Error('Cannot remove yourself as the last admin')
    }
  }

  // Delete membership
  await prisma.orgMember.delete({
    where: { id: memberId }
  })

  revalidatePath(`/${orgSlug}/settings/members`)
  return { success: true }
}

export async function requireRole(
  orgSlug: string,
  userId: string,
  minRole: OrgRole
): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      members: {
        where: { userId }
      }
    }
  })

  if (!org || org.members.length === 0) {
    return false
  }

  const roleHierarchy: Record<OrgRole, number> = {
    VIEWER: 1,
    EDITOR: 2,
    ADMIN: 3
  }

  const userRole = org.members[0].role
  return roleHierarchy[userRole] >= roleHierarchy[minRole]
}
