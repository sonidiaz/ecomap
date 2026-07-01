import Link from "next/link"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, Upload, Settings, Network } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { ActionCard } from "@/components/dashboard/action-card"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"

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

  // Configuración de stats (declarativo)
  const stats = [
    {
      id: 'members',
      label: 'Miembros',
      value: org._count.members,
      description: 'Usuarios con acceso',
      icon: Users,
    },
    {
      id: 'collaborators',
      label: 'Colaboradores',
      value: org._count.collaborators,
      description: 'En tu red',
      icon: Building2,
    },
    {
      id: 'imports',
      label: 'Importaciones',
      value: org._count.importLogs,
      description: 'Archivos procesados',
      icon: Upload,
    },
  ]

  // Configuración de acciones (declarativo)
  const actions = [
    {
      id: 'collaborators',
      title: 'Colaboradores',
      description: 'Ver y gestionar tu red',
      icon: Building2,
      href: `/${orgSlug}/collaborators`,
    },
    {
      id: 'graph',
      title: 'Grafo de Red',
      description: 'Visualiza las órbitas',
      icon: Network,
      href: `/${orgSlug}/graph`,
    },
    {
      id: 'import',
      title: 'Importar Excel',
      description: 'Cargar colaboradores',
      icon: Upload,
      href: `/${orgSlug}/import`,
    },
    {
      id: 'settings',
      title: 'Configuración',
      description: 'Ajustes y miembros',
      icon: Settings,
      href: `/${orgSlug}/settings`,
    },
    {
      id: 'members',
      title: 'Miembros',
      description: 'Gestionar equipo',
      icon: Users,
      href: `/${orgSlug}/settings/members`,
    },
  ]

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

        {/* Stats Cards - Modular */}
        <DashboardGrid cols={{ base: 1, md: 3 }}>
          {stats.map((stat) => (
            <StatCard key={stat.id} {...stat} />
          ))}
        </DashboardGrid>

        {/* Quick Actions - Modular */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiona tu organización y colaboradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardGrid cols={{ base: 1, md: 2, lg: 3 }}>
              {actions.map((action) => (
                <ActionCard key={action.id} {...action} />
              ))}
            </DashboardGrid>
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
                <Button variant="default" asChild>
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
