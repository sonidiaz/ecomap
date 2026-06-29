"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createOrganization } from "@/lib/org-actions"
import { generateSlug } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NewOrganizationPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const slugPreview = name ? generateSlug(name) : ""

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createOrganization(formData)

      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
      // If successful, the server action will redirect
    } catch (err) {
      setError("Error al crear la organización")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/organizations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="text-4xl font-bold">Crear Organización</h1>
          <p className="mt-2 text-gray-600">
            Configura tu organización para empezar a mapear colaboradores
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Organización</CardTitle>
            <CardDescription>
              Completa los datos básicos de tu organización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ej: Mi Organización"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {slugPreview && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    URL de la organización:
                  </p>
                  <p className="mt-1 font-mono text-sm font-medium">
                    /{slugPreview}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  name="description"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe brevemente tu organización (opcional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="default" type="submit" disabled={!name || isLoading} className="flex-1">
                  {isLoading ? "Creando..." : "Crear Organización"}
                </Button>
                <Button type="button" variant="outline" asChild disabled={isLoading}>
                  <Link href="/organizations">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Qué sucederá:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Serás agregado automáticamente como ADMIN</li>
                <li>Podrás invitar a otros miembros más tarde</li>
                <li>Podrás importar colaboradores desde Excel</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
