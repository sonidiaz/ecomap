import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getCollaborator, getProximityScore } from "@/lib/collaborator-actions"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatOrbit, findSimilarCollaborators } from "@/lib/utils"
import { Building2, Mail, Phone, MapPin, Users, Edit, Archive, ArrowLeft } from "lucide-react"
import { ArchiveButton } from "@/components/archive-button"

interface CollaboratorDetailPageProps {
  params: Promise<{
    orgSlug: string
    collaboratorId: string
  }>
}

export default async function CollaboratorDetailPage({ params }: CollaboratorDetailPageProps) {
  const { orgSlug, collaboratorId } = await params

  // Auth check
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get collaborator
  const collaborator = await getCollaborator(collaboratorId)
  const score = await getProximityScore(collaboratorId)

  // Verify user has access to this org
  const membership = await prisma.orgMember.findUnique({
    where: {
      orgId_userId: {
        orgId: collaborator.orgId,
        userId: session.user.id
      }
    }
  })

  if (!membership) {
    redirect('/organizations')
  }

  // Get similar collaborators
  const allCollaborators = await prisma.collaborator.findMany({
    where: {
      orgId: collaborator.orgId,
      isArchived: false,
      id: { not: collaborator.id }
    }
  })

  const similarCollaborators = findSimilarCollaborators(collaborator, allCollaborators)

  const canEdit = membership.role !== 'VIEWER'

  const typeLabels = {
    PERSON: '👤 Persona',
    ORGANIZATION: '🏢 Organización',
    PROJECT: '📋 Proyecto',
  }

  return (
    <div className="container max-w-5xl py-8">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/${orgSlug}/collaborators`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                {collaborator.photoUrl ? (
                  <img
                    src={collaborator.photoUrl}
                    alt={collaborator.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                    {collaborator.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold mb-2">{collaborator.name}</h1>
                  <div className="text-muted-foreground mb-4">
                    {typeLabels[collaborator.type]}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    {canEdit && (
                      <>
                        <Button asChild>
                          <Link href={`/${orgSlug}/collaborators/${collaboratorId}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </Button>
                        <ArchiveButton
                          collaboratorId={collaboratorId}
                          isArchived={collaborator.isArchived}
                          orgSlug={orgSlug}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact info */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {collaborator.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <a href={`mailto:${collaborator.email}`} className="text-blue-600 hover:underline">
                    {collaborator.email}
                  </a>
                </div>
              )}
              {collaborator.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <a href={`tel:${collaborator.phone}`} className="text-blue-600 hover:underline">
                    {collaborator.phone}
                  </a>
                </div>
              )}
              {collaborator.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span>{collaborator.company}</span>
                </div>
              )}
              {(collaborator.city || collaborator.country) && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {[collaborator.city, collaborator.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {collaborator.address && (
                <div className="text-sm text-muted-foreground mt-2">
                  {collaborator.address}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {collaborator.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Etiquetas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {collaborator.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {collaborator.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{collaborator.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Similar connections */}
          {similarCollaborators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Conexiones Relacionadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {similarCollaborators.map((similar) => (
                    <Link
                      key={similar.id}
                      href={`/${orgSlug}/collaborators/${similar.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div>
                        <div className="font-medium">{similar.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {similar.tags.filter(t => collaborator.tags.includes(t)).join(', ')}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Proximity score */}
          {score && (
            <Card>
              <CardHeader>
                <CardTitle>Puntuación de Proximidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Total */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Total</span>
                    <Badge
                      className={
                        score.orbit === 'CORE'
                          ? 'bg-green-100 text-green-800'
                          : score.orbit === 'MID'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {formatOrbit(score.orbit)} • {score.scoreTotal.toFixed(1)} pts
                    </Badge>
                  </div>
                  <Progress value={score.scoreTotal} className="h-3" />
                </div>

                {/* Breakdown */}
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground">Colaboración Activa</span>
                      <span className="font-medium">{score.scoreCollabActive.toFixed(1)} / 30</span>
                    </div>
                    <Progress value={(score.scoreCollabActive / 30) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground">Colaboración Pasada</span>
                      <span className="font-medium">{score.scoreCollabPast.toFixed(1)} / 20</span>
                    </div>
                    <Progress value={(score.scoreCollabPast / 20) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground">Proximidad Geográfica</span>
                      <span className="font-medium">{score.scoreGeo.toFixed(1)} / 20</span>
                    </div>
                    <Progress value={(score.scoreGeo / 20) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground">Frecuencia de Contacto</span>
                      <span className="font-medium">{score.scoreFrequency.toFixed(1)} / 15</span>
                    </div>
                    <Progress value={(score.scoreFrequency / 15) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-muted-foreground">Afinidad Temática</span>
                      <span className="font-medium">{score.scoreAffinity.toFixed(1)} / 15</span>
                    </div>
                    <Progress value={(score.scoreAffinity / 15) * 100} className="h-2" />
                  </div>
                </div>

                <div className="pt-3 border-t text-xs text-muted-foreground">
                  Última actualización: {new Date(score.calculatedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Collaboration status */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Colaboración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Colaboración activa</span>
                <Badge variant={collaborator.collabActive ? "default" : "secondary"}>
                  {collaborator.collabActive ? 'Sí' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Colaboración pasada</span>
                <Badge variant={collaborator.collabPast ? "default" : "secondary"}>
                  {collaborator.collabPast ? 'Sí' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Frecuencia de contacto</span>
                <span className="font-medium">{collaborator.contactFrequency}/5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
