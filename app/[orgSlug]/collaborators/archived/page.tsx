import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getOrgBySlug, getCollaborators } from "@/lib/collaborator-actions"
import { prisma } from "@/lib/db"
import { CollaboratorCard } from "@/components/collaborator-card"
import { Button } from "@/components/ui/button"
import { Archive, ArrowLeft } from "lucide-react"

interface ArchivedCollaboratorsPageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default async function ArchivedCollaboratorsPage({ params }: ArchivedCollaboratorsPageProps) {
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

  // Get archived collaborators
  const archivedCollaborators = await getCollaborators(org.id, true)
  const onlyArchived = archivedCollaborators.filter(c => c.isArchived)

  // Get proximity scores (though they won't change while archived)
  const scores = await prisma.proximityScore.findMany({
    where: {
      orgId: org.id,
      collaboratorId: { in: onlyArchived.map(c => c.id) }
    }
  })

  const scoresMap = new Map(scores.map(s => [s.collaboratorId, s]))

  return (
    <div className="container py-8">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/${orgSlug}/collaborators`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a colaboradores activos
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Archive className="h-8 w-8" />
          Colaboradores Archivados
        </h1>
        <p className="text-muted-foreground mt-2">
          Colaboradores que han sido archivados y no aparecen en el grafo
        </p>
      </div>

      {/* Archived collaborators grid */}
      {onlyArchived.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
          <Archive className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay colaboradores archivados</h3>
          <p className="text-muted-foreground mb-6">
            Los colaboradores archivados aparecerán aquí
          </p>
          <Button variant="outline" asChild>
            <Link href={`/${orgSlug}/collaborators`}>
              Ver Colaboradores Activos
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 text-sm text-muted-foreground">
            {onlyArchived.length} colaborador{onlyArchived.length !== 1 ? 'es' : ''} archivado{onlyArchived.length !== 1 ? 's' : ''}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {onlyArchived.map((collaborator) => (
              <CollaboratorCard
                key={collaborator.id}
                collaborator={collaborator}
                score={scoresMap.get(collaborator.id)}
                orgSlug={orgSlug}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
