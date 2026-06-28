import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { MemberTable } from "@/components/member-table"
import { InviteMemberForm } from "@/components/invite-member-form"

interface MembersPageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default async function MembersPage({ params }: MembersPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const { orgSlug } = await params

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  })

  if (!org) {
    redirect('/organizations')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Miembros del Equipo</h2>
        <p className="text-muted-foreground">
          Gestiona quién tiene acceso a tu organización
        </p>
      </div>

      <InviteMemberForm orgSlug={orgSlug} />

      <div>
        <h3 className="text-lg font-semibold mb-4">
          Miembros Actuales ({org.members.length})
        </h3>
        <MemberTable
          members={org.members}
          orgSlug={orgSlug}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  )
}
