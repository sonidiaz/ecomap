import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getUserOrganizations, selectOrganization } from "@/lib/org-actions"
import { OrgCard } from "@/components/org-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"

export default async function OrganizationsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const userOrgs = await getUserOrganizations(session.user.id)

  if (userOrgs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Bienvenido a EcoMap</CardTitle>
            <CardDescription className="text-base">
              Aún no perteneces a ninguna organización
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-center text-sm text-muted-foreground">
              Crea tu primera organización para empezar a mapear tu red de colaboradores
            </p>
            <Button asChild size="lg">
              <Link href="/organizations/new">
                <Plus className="mr-2 h-5 w-5" />
                Crear Organización
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Mis Organizaciones</h1>
            <p className="mt-2 text-gray-600">
              Selecciona una organización para continuar
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/organizations/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Organización
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userOrgs.map((membership) => (
            <form
              key={membership.id}
              action={async () => {
                "use server"
                await selectOrganization(membership.org.slug)
              }}
            >
              <button type="submit" className="w-full text-left cursor-pointer">
                <OrgCard
                  name={membership.org.name}
                  slug={membership.org.slug}
                  description={membership.org.description}
                  role={membership.role}
                  memberCount={membership.org._count.members}
                  collaboratorCount={membership.org._count.collaborators}
                />
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  )
}
