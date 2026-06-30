import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getOrgBySlug, getAllTags } from "@/lib/collaborator-actions"
import { CollaboratorForm } from "@/components/collaborator-form"
import { requireRole } from "@/lib/member-actions"

interface NewCollaboratorPageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default async function NewCollaboratorPage({ params }: NewCollaboratorPageProps) {
  const { orgSlug } = await params

  // Auth check
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get organization
  const org = await getOrgBySlug(orgSlug)

  // Check permissions (EDITOR or ADMIN)
  const hasPermission = await requireRole(orgSlug, session.user.id, 'EDITOR')
  if (!hasPermission) {
    redirect(`/${orgSlug}`)
  }

  // Get existing tags for autocomplete
  const allTags = await getAllTags(org.id)

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuevo Colaborador</h1>
        <p className="text-muted-foreground mt-2">
          Agrega un nuevo colaborador a tu red de {org.name}
        </p>
      </div>

      <CollaboratorForm
        mode="create"
        orgSlug={orgSlug}
        allTags={allTags}
      />
    </div>
  )
}
