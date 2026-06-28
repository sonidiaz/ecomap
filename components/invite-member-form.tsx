"use client"

import { useState } from "react"
import { inviteMember } from "@/lib/member-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

interface InviteMemberFormProps {
  orgSlug: string
}

export function InviteMemberForm({ orgSlug }: InviteMemberFormProps) {
  const router = useRouter()
  const [role, setRole] = useState<string>("VIEWER")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Add role to formData
    formData.set('role', role)

    try {
      const result = await inviteMember(orgSlug, formData)
      if (result.success) {
        setSuccess(true)
        // Reset form
        const form = document.getElementById('invite-form') as HTMLFormElement
        form?.reset()
        setRole("VIEWER")
        // Refresh the page to show new member
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al invitar miembro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Invitar Miembro
        </CardTitle>
        <CardDescription>
          Añade un nuevo miembro a tu organización. El usuario debe estar registrado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="invite-form" action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">
                      Acceso completo, puede gestionar miembros
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="EDITOR">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Editor</span>
                    <span className="text-xs text-muted-foreground">
                      Puede crear y editar colaboradores
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="VIEWER">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Viewer</span>
                    <span className="text-xs text-muted-foreground">
                      Solo lectura
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
              ¡Miembro invitado exitosamente!
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? 'Invitando...' : 'Invitar Miembro'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
