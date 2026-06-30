import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getCollaborator, getAllTags } from "@/lib/collaborator-actions"
import { prisma } from "@/lib/db"
import { CollaboratorForm } from "@/components/collaborator-form"
import { requireRole } from "@/lib/member-actions"

interface EditCollaboratorPageProps {
  params: Promise<{
    orgSlug: string
    collaboratorId: string
  }>
}

export default async function EditCollaboratorPage({ params }: EditCollaboratorPageProps) {
  const { orgSlug, collaboratorId } = await params

  // Auth check
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get collaborator
  const collaborator = await getCollaborator(collaboratorId)

  // Check permissions (EDITOR or ADMIN)
  const hasPermission = await requireRole(orgSlug, session.user.id, 'EDITOR')
  if (!hasPermission) {
    redirect(`/${orgSlug}/collaborators/${collaboratorId}`)
  }

  // Get existing tags for autocomplete
  const allTags = await getAllTags(collaborator.orgId)

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Colaborador</h1>
        <p className="text-muted-foreground mt-2">
          Actualiza la información de {collaborator.name}
        </p>
      </div>

      <CollaboratorForm
        mode="edit"
        orgSlug={orgSlug}
        initialData={collaborator}
        allTags={allTags}
      />
    </div>
  )
}
