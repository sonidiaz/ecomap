"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Collaborator } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"
import { TagInput } from "@/components/tag-input"
import { createCollaborator, updateCollaborator } from "@/lib/collaborator-actions"
import { Loader2 } from "lucide-react"

interface CollaboratorFormProps {
  mode: 'create' | 'edit'
  orgSlug: string
  initialData?: Collaborator
  allTags?: string[]
}

export function CollaboratorForm({
  mode,
  orgSlug,
  initialData,
  allTags = []
}: CollaboratorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState(initialData?.name || "")
  const [email, setEmail] = useState(initialData?.email || "")
  const [phone, setPhone] = useState(initialData?.phone || "")
  const [address, setAddress] = useState(initialData?.address || "")
  const [lat, setLat] = useState<number | null>(initialData?.lat || null)
  const [lng, setLng] = useState<number | null>(initialData?.lng || null)
  const [city, setCity] = useState(initialData?.city || "")
  const [country, setCountry] = useState(initialData?.country || "")
  const [type, setType] = useState(initialData?.type || "PERSON")
  const [company, setCompany] = useState(initialData?.company || "")
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [notes, setNotes] = useState(initialData?.notes || "")
  const [collabActive, setCollabActive] = useState(initialData?.collabActive || false)
  const [collabPast, setCollabPast] = useState(initialData?.collabPast || false)
  const [contactFrequency, setContactFrequency] = useState(initialData?.contactFrequency || 0)
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || "")

  const handlePlaceSelected = (place: {
    address: string
    lat: number
    lng: number
    city?: string
    country?: string
  }) => {
    setAddress(place.address)
    setLat(place.lat)
    setLng(place.lng)
    setCity(place.city || "")
    setCountry(place.country || "")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.append('name', name)
    if (email) formData.append('email', email)
    if (phone) formData.append('phone', phone)
    if (address) formData.append('address', address)
    if (lat !== null) formData.append('lat', lat.toString())
    if (lng !== null) formData.append('lng', lng.toString())
    if (city) formData.append('city', city)
    if (country) formData.append('country', country)
    formData.append('type', type)
    if (company) formData.append('company', company)
    formData.append('tags', tags.join(','))
    if (notes) formData.append('notes', notes)
    formData.append('collabActive', collabActive.toString())
    formData.append('collabPast', collabPast.toString())
    formData.append('contactFrequency', contactFrequency.toString())
    if (photoUrl) formData.append('photoUrl', photoUrl)

    startTransition(async () => {
      try {
        let result

        if (mode === 'create') {
          result = await createCollaborator(orgSlug, formData)
        } else {
          if (!initialData?.id) {
            setError('ID de colaborador no encontrado')
            return
          }
          result = await updateCollaborator(initialData.id, formData)
        }

        if (result.error) {
          setError(result.error)
        } else {
          // Success - redirect
          router.push(`/${orgSlug}/collaborators`)
          router.refresh()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar colaborador')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>
            Datos generales del colaborador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre completo"
              required
              disabled={isPending}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(value) => setType(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERSON">Persona</SelectItem>
                <SelectItem value="ORGANIZATION">Organización</SelectItem>
                <SelectItem value="PROJECT">Proyecto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Empresa/Organización</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nombre de la empresa"
              disabled={isPending}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={isPending}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicación</CardTitle>
          <CardDescription>
            Dirección del colaborador para cálculo de proximidad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GooglePlacesAutocomplete
            onPlaceSelected={handlePlaceSelected}
            initialValue={address}
            required
            disabled={isPending}
          />

          {/* Hidden fields for geocoding data */}
          <input type="hidden" name="lat" value={lat || ""} />
          <input type="hidden" name="lng" value={lng || ""} />
          <input type="hidden" name="city" value={city} />
          <input type="hidden" name="country" value={country} />

          {lat && lng && (
            <div className="text-xs text-muted-foreground">
              📍 Coordenadas: {lat.toFixed(6)}, {lng.toFixed(6)}
              {city && ` • ${city}`}
              {country && `, ${country}`}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relación y Cercanía</CardTitle>
          <CardDescription>
            Parámetros que afectan la puntuación de proximidad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tags */}
          <TagInput
            value={tags}
            onChange={setTags}
            suggestions={allTags}
            label="Etiquetas Temáticas"
            placeholder="Agrega etiquetas..."
          />

          {/* Collaboration checkboxes */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="collabActive"
              checked={collabActive}
              onChange={(e) => setCollabActive(e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="collabActive" className="cursor-pointer font-normal">
              Colaboración activa (actualmente trabajando juntos)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="collabPast"
              checked={collabPast}
              onChange={(e) => setCollabPast(e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="collabPast" className="cursor-pointer font-normal">
              Colaboración pasada (han trabajado juntos antes)
            </Label>
          </div>

          {/* Contact frequency */}
          <div className="space-y-2">
            <Label htmlFor="contactFrequency">
              Frecuencia de Contacto: {contactFrequency}/5
            </Label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                id="contactFrequency"
                min="0"
                max="5"
                step="1"
                value={contactFrequency}
                onChange={(e) => setContactFrequency(parseInt(e.target.value))}
                disabled={isPending}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12 text-right">
                {['Sin contacto', 'Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta'][contactFrequency]}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="photoUrl">URL de Foto (opcional)</Label>
            <Input
              id="photoUrl"
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Por ahora solo URLs externas. Upload de fotos próximamente.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales sobre el colaborador..."
              rows={4}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1 sm:flex-none"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Crear Colaborador' : 'Guardar Cambios'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${orgSlug}/collaborators`)}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
