import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, Upload, Settings, Network } from "lucide-react"

interface OrgDashboardProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default async function OrgDashboard({ params }: OrgDashboardProps) {
  const { orgSlug } = await params

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      _count: {
        select: {
          members: true,
          collaborators: true,
          importLogs: true,
        }
      }
    }
  })

  if (!org) {
    return null // Layout handles not found
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-4xl font-bold">{org.name}</h1>
          {org.description && (
            <p className="mt-2 text-lg text-muted-foreground">{org.description}</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{org._count.members}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios con acceso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{org._count.collaborators}</div>
              <p className="text-xs text-muted-foreground">
                En tu red
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Importaciones</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{org._count.importLogs}</div>
              <p className="text-xs text-muted-foreground">
                Archivos procesados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiona tu organización y colaboradores
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href={`/${orgSlug}/collaborators`}>
                <Building2 className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Colaboradores</div>
                  <div className="text-sm text-muted-foreground">
                    Ver y gestionar tu red
                  </div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href={`/${orgSlug}/graph`}>
                <Network className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Grafo de Red</div>
                  <div className="text-sm text-muted-foreground">
                    Visualiza las órbitas
                  </div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href={`/${orgSlug}/import`}>
                <Upload className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Importar Excel</div>
                  <div className="text-sm text-muted-foreground">
                    Cargar colaboradores
                  </div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href={`/${orgSlug}/settings`}>
                <Settings className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Configuración</div>
                  <div className="text-sm text-muted-foreground">
                    Ajustes y miembros
                  </div>
                </div>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
              <Link href={`/${orgSlug}/settings/members`}>
                <Users className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Miembros</div>
                  <div className="text-sm text-muted-foreground">
                    Gestionar equipo
                  </div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Getting Started */}
        {org._count.collaborators === 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle>¡Comienza a mapear tu red!</CardTitle>
              <CardDescription>
                Aún no tienes colaboradores. Aquí tienes algunas opciones para empezar:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Importa desde Excel</p>
                  <p className="text-sm text-muted-foreground">
                    Usa nuestra plantilla para cargar múltiples colaboradores a la vez
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Añade manualmente</p>
                  <p className="text-sm text-muted-foreground">
                    Crea colaboradores uno por uno con todos los detalles
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button asChild>
                  <Link href={`/${orgSlug}/import`}>Importar Excel</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/${orgSlug}/collaborators`}>Añadir Manualmente</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
