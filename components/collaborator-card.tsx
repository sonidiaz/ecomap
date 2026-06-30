import Link from "next/link"
import type { Collaborator, ProximityScore } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatOrbit } from "@/lib/utils"
import { Building2, Mail, MapPin, User, FolderKanban } from "lucide-react"

interface CollaboratorCardProps {
  collaborator: Collaborator
  score?: ProximityScore | null
  orgSlug: string
}

export function CollaboratorCard({ collaborator, score, orgSlug }: CollaboratorCardProps) {
  const typeIcons = {
    PERSON: User,
    ORGANIZATION: Building2,
    PROJECT: FolderKanban,
  }

  const TypeIcon = typeIcons[collaborator.type]

  return (
    <Link href={`/${orgSlug}/collaborators/${collaborator.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-6">
          {/* Header with avatar and name */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            {collaborator.photoUrl ? (
              <img
                src={collaborator.photoUrl}
                alt={collaborator.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                {collaborator.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name and type */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {collaborator.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TypeIcon className="h-4 w-4" />
                <span>
                  {collaborator.type === 'PERSON' && 'Persona'}
                  {collaborator.type === 'ORGANIZATION' && 'Organización'}
                  {collaborator.type === 'PROJECT' && 'Proyecto'}
                </span>
              </div>
            </div>

            {/* Orbit badge */}
            {score && (
              <Badge
                className={
                  score.orbit === 'CORE'
                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                    : score.orbit === 'MID'
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                }
              >
                {formatOrbit(score.orbit)}
              </Badge>
            )}
          </div>

          {/* Company */}
          {collaborator.company && (
            <p className="text-sm text-muted-foreground mb-3 truncate">
              {collaborator.company}
            </p>
          )}

          {/* Contact info */}
          <div className="space-y-2 mb-4">
            {collaborator.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{collaborator.email}</span>
              </div>
            )}
            {(collaborator.city || collaborator.country) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {[collaborator.city, collaborator.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {collaborator.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {collaborator.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {collaborator.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{collaborator.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Score */}
          {score && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Puntuación</span>
                <span className="font-semibold">{score.scoreTotal.toFixed(0)} pts</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
