"use client"

import type { Collaborator, ProximityScore } from "@prisma/client"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatOrbit, findSimilarCollaborators } from "@/lib/utils"
import { Building2, Mail, Phone, MapPin, Users } from "lucide-react"

interface NodeDetailsPanelProps {
  isOpen: boolean
  onClose: () => void
  collaborator: Collaborator | null
  proximityScore: ProximityScore | null
  allCollaborators: Collaborator[]
}

export function NodeDetailsPanel({
  isOpen,
  onClose,
  collaborator,
  proximityScore,
  allCollaborators,
}: NodeDetailsPanelProps) {
  if (!collaborator || !proximityScore) return null

  const similarCollaborators = findSimilarCollaborators(collaborator, allCollaborators)

  // Iconos por tipo
  const typeLabels = {
    PERSON: '👤 Persona',
    ORGANIZATION: '🏢 Organización',
    PROJECT: '📋 Proyecto',
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {collaborator.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-bold">{collaborator.name}</div>
              <div className="text-sm text-muted-foreground">
                {typeLabels[collaborator.type]}
              </div>
            </div>
          </SheetTitle>
          <SheetDescription>
            Detalles del colaborador y puntuación de proximidad
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Órbita y Puntuación Total */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Puntuación Total</span>
              <Badge
                className={
                  proximityScore.orbit === 'CORE'
                    ? 'bg-green-100 text-green-800'
                    : proximityScore.orbit === 'MID'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {formatOrbit(proximityScore.orbit)} • {proximityScore.scoreTotal.toFixed(1)} pts
              </Badge>
            </div>
            <Progress value={proximityScore.scoreTotal} className="h-3" />
          </div>

          {/* Desglose de Scores */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Desglose de Puntuación</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Colaboración Activa</span>
                <span className="font-medium">{proximityScore.scoreCollabActive.toFixed(1)} / 30</span>
              </div>
              <Progress value={(proximityScore.scoreCollabActive / 30) * 100} className="h-2" />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Colaboración Pasada</span>
                <span className="font-medium">{proximityScore.scoreCollabPast.toFixed(1)} / 20</span>
              </div>
              <Progress value={(proximityScore.scoreCollabPast / 20) * 100} className="h-2" />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Proximidad Geográfica</span>
                <span className="font-medium">{proximityScore.scoreGeo.toFixed(1)} / 20</span>
              </div>
              <Progress value={(proximityScore.scoreGeo / 20) * 100} className="h-2" />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Frecuencia de Contacto</span>
                <span className="font-medium">{proximityScore.scoreFrequency.toFixed(1)} / 15</span>
              </div>
              <Progress value={(proximityScore.scoreFrequency / 15) * 100} className="h-2" />

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Afinidad Temática</span>
                <span className="font-medium">{proximityScore.scoreAffinity.toFixed(1)} / 15</span>
              </div>
              <Progress value={(proximityScore.scoreAffinity / 15) * 100} className="h-2" />
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Contacto</h3>
            <div className="space-y-2 text-sm">
              {collaborator.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{collaborator.email}</span>
                </div>
              )}
              {collaborator.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{collaborator.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Información General */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Información</h3>
            <div className="space-y-2 text-sm">
              {collaborator.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{collaborator.company}</span>
                </div>
              )}
              {(collaborator.city || collaborator.country) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {[collaborator.city, collaborator.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground">Frecuencia contacto:</span>
                <span className="font-medium">{collaborator.contactFrequency}/5</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {collaborator.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {collaborator.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {collaborator.notes && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Notas</h3>
              <p className="text-sm text-muted-foreground">{collaborator.notes}</p>
            </div>
          )}

          {/* Conexiones Relacionadas */}
          {similarCollaborators.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Conexiones Relacionadas
              </h3>
              <div className="space-y-2">
                {similarCollaborators.map((similar) => (
                  <div
                    key={similar.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">{similar.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {similar.tags.filter(t => collaborator.tags.includes(t)).join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
