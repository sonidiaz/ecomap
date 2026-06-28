"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { setCurrentOrgSlug } from "@/lib/org-utils"
import { organizationSchema } from "@/lib/validations"

export async function getUserOrganizations(userId: string) {
  return prisma.orgMember.findMany({
    where: { userId },
    include: {
      org: {
        include: {
          _count: {
            select: { members: true, collaborators: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createOrganization(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string | null

  // Validate
  const result = organizationSchema.safeParse({
    name,
    slug: generateSlug(name),
    description: description || undefined,
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  let slug = generateSlug(name)

  // Check slug uniqueness
  const existing = await prisma.organization.findUnique({
    where: { slug }
  })

  if (existing) {
    // Add random suffix for uniqueness
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`
  }

  // Create organization with user as ADMIN
  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      description: description || undefined,
      members: {
        create: {
          userId: session.user.id,
          role: 'ADMIN'
        }
      }
    }
  })

  // Set as current org
  await setCurrentOrgSlug(org.slug)

  revalidatePath('/organizations')
  redirect(`/${org.slug}`)
}

export async function selectOrganization(orgSlug: string) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Verify user has access
  const membership = await prisma.orgMember.findFirst({
    where: {
      userId: session.user.id,
      org: {
        slug: orgSlug
      }
    }
  })

  if (!membership) {
    return { error: 'No tienes acceso a esta organización' }
  }

  await setCurrentOrgSlug(orgSlug)
  redirect(`/${orgSlug}`)
}
