import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { updateOrganization } from "@/lib/org-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface SettingsPageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const { orgSlug } = await params

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug }
  })

  if (!org) {
    redirect('/organizations')
  }

  const updateOrgAction = updateOrganization.bind(null, orgSlug)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
          <CardDescription>
            Actualiza la información básica de tu organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateOrgAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                defaultValue={org.name}
                placeholder="Nombre de la organización"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={org.description || ''}
                placeholder="Describe tu organización (opcional)"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={org.slug}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-muted-foreground">
                El slug no se puede modificar una vez creada la organización
              </p>
            </div>

            <Button type="submit">
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
          <CardDescription>
            Acciones irreversibles para tu organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Eliminar Organización</p>
              <p className="text-sm text-muted-foreground">
                Una vez eliminada, no se puede recuperar
              </p>
            </div>
            <Button variant="destructive" disabled>
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
