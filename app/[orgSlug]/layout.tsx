import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { OrgHeader } from "@/components/org-header"

interface OrgLayoutProps {
  children: React.ReactNode
  params: Promise<{
    orgSlug: string
  }>
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const { orgSlug } = await params

  // Fetch organization and verify user access
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      members: {
        where: { userId: session.user.id }
      },
      _count: {
        select: { members: true, collaborators: true }
      }
    }
  })

  if (!org) {
    notFound()
  }

  // Check if user has access
  if (org.members.length === 0) {
    redirect('/organizations')
  }

  const membership = org.members[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <OrgHeader
        org={{
          name: org.name,
          slug: org.slug,
          logo: org.logo,
        }}
        userRole={membership.role}
        user={{
          name: session.user.name || '',
          email: session.user.email || '',
          image: session.user.image || null,
        }}
      />
      <main>{children}</main>
    </div>
  )
}
