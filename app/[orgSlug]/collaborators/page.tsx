import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getOrgBySlug, getCollaborators } from "@/lib/collaborator-actions"
import { prisma } from "@/lib/db"
import { CollaboratorCard } from "@/components/collaborator-card"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"

interface CollaboratorsPageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default async function CollaboratorsPage({ params }: CollaboratorsPageProps) {
  const { orgSlug } = await params

  // Auth check
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get organization
  const org = await getOrgBySlug(orgSlug)

  // Check user has access
  const membership = await prisma.orgMember.findUnique({
    where: {
      orgId_userId: {
        orgId: org.id,
        userId: session.user.id
      }
    }
  })

  if (!membership) {
    redirect('/organizations')
  }

  // Get collaborators (active only)
  const collaborators = await getCollaborators(org.id, false)

  // Get proximity scores
  const scores = await prisma.proximityScore.findMany({
    where: { orgId: org.id }
  })

  // Create scores map for quick lookup
  const scoresMap = new Map(scores.map(s => [s.collaboratorId, s]))

  const canEdit = membership.role !== 'VIEWER'

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            Colaboradores
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona la red de colaboradores de {org.name}
          </p>
        </div>

        {canEdit && (
          <Button asChild>
            <Link href={`/${orgSlug}/collaborators/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Colaborador
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{collaborators.length}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Cercano</div>
          <div className="text-2xl font-bold text-green-600">
            {scores.filter(s => s.orbit === 'CORE').length}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Medio</div>
          <div className="text-2xl font-bold text-yellow-600">
            {scores.filter(s => s.orbit === 'MID').length}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Lejano</div>
          <div className="text-2xl font-bold text-gray-600">
            {scores.filter(s => s.orbit === 'PERIPHERY').length}
          </div>
        </div>
      </div>

      {/* Collaborators grid */}
      {collaborators.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay colaboradores todavía</h3>
          <p className="text-muted-foreground mb-6">
            Empieza agregando tu primer colaborador a la red
          </p>
          {canEdit && (
            <Button asChild>
              <Link href={`/${orgSlug}/collaborators/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Colaborador
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collaborators.map((collaborator) => (
            <CollaboratorCard
              key={collaborator.id}
              collaborator={collaborator}
              score={scoresMap.get(collaborator.id)}
              orgSlug={orgSlug}
            />
          ))}
        </div>
      )}

      {/* Quick actions */}
      {collaborators.length > 0 && (
        <div className="mt-8 flex gap-4">
          <Button variant="outline" asChild>
            <Link href={`/${orgSlug}/graph`}>
              Ver en Grafo
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${orgSlug}/collaborators/archived`}>
              Ver Archivados
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
