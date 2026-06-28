import { OrgRole } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getRoleBadgeColor, formatRole } from "@/lib/utils"
import { Users, Building2 } from "lucide-react"

interface OrgCardProps {
  name: string
  slug: string
  description?: string | null
  role: OrgRole
  memberCount: number
  collaboratorCount: number
}

export function OrgCard({
  name,
  slug,
  description,
  role,
  memberCount,
  collaboratorCount,
}: OrgCardProps) {
  return (
    <Card className="transition-all hover:shadow-lg hover:scale-[1.02]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {description || "Sin descripción"}
            </CardDescription>
          </div>
          <Badge className={getRoleBadgeColor(role)} variant="secondary">
            {formatRole(role)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{memberCount} {memberCount === 1 ? "miembro" : "miembros"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            <span>{collaboratorCount} {collaboratorCount === 1 ? "colaborador" : "colaboradores"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
