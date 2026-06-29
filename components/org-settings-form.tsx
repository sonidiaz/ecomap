"use client"

import { useState } from "react"
import { updateOrganization } from "@/lib/org-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface OrgSettingsFormProps {
  org: {
    slug: string
    name: string
    description: string | null
  }
}

export function OrgSettingsForm({ org }: OrgSettingsFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateOrganization(org.slug, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar organización')
    } finally {
      setLoading(false)
    }
  }

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
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                defaultValue={org.name}
                placeholder="Nombre de la organización"
                required
                disabled={loading}
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
                disabled={loading}
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

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                ¡Organización actualizada exitosamente!
              </div>
            )}

            <Button className="text-white" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
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
