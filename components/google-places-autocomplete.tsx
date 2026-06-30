"use client"

import { useRef, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PlaceResult {
  address: string
  lat: number
  lng: number
  city?: string
  country?: string
}

interface GooglePlacesAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void
  initialValue?: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

// Google Maps types
interface GoogleAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

interface GoogleGeometry {
  location: {
    lat: () => number
    lng: () => number
  }
}

interface GooglePlace {
  formatted_address?: string
  geometry?: GoogleGeometry
  address_components?: GoogleAddressComponent[]
}

interface GoogleAutocomplete {
  addListener: (event: string, callback: () => void) => void
  getPlace: () => GooglePlace
}

interface GoogleMapsAPI {
  maps: {
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        options?: { types?: string[]; fields?: string[] }
      ) => GoogleAutocomplete
    }
    event: {
      clearInstanceListeners: (instance: any) => void
    }
  }
}

// Extend window type for Google Maps
declare global {
  interface Window {
    google?: GoogleMapsAPI
    initGoogleMapsAutocomplete?: () => void
  }
}

export function GooglePlacesAutocomplete({
  onPlaceSelected,
  initialValue = "",
  label = "Dirección",
  placeholder = "Busca una dirección...",
  required = false,
  disabled = false
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null)
  const [value, setValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      setError('Google Places API key no configurada')
      console.error('NEXT_PUBLIC_GOOGLE_PLACES_API_KEY no está definida en las variables de entorno')
      return
    }

    // Load Google Maps script if not already loaded
    if (!window.google) {
      setIsLoading(true)
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        setIsLoading(false)
        initAutocomplete()
      }
      script.onerror = () => {
        setIsLoading(false)
        setError('Error al cargar Google Maps')
      }
      document.head.appendChild(script)
    } else {
      initAutocomplete()
    }

    function initAutocomplete() {
      if (!inputRef.current || !window.google) return

      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["address"],
            fields: ["formatted_address", "geometry", "address_components"]
          }
        )

        autocompleteRef.current.addListener("place_changed", handlePlaceSelect)
        setError(null)
      } catch (err) {
        console.error('Error inicializando Google Places Autocomplete:', err)
        setError('Error al inicializar autocomplete')
      }
    }

    function handlePlaceSelect() {
      const place = autocompleteRef.current?.getPlace()

      if (!place?.geometry?.location) {
        console.warn('No se pudo obtener la ubicación del lugar seleccionado')
        return
      }

      const address = place.formatted_address || ""
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()

      let city: string | undefined
      let country: string | undefined

      place.address_components?.forEach((component: GoogleAddressComponent) => {
        if (component.types.includes("locality")) {
          city = component.long_name
        }
        if (component.types.includes("country")) {
          country = component.long_name
        }
      })

      setValue(address)
      onPlaceSelected({ address, lat, lng, city, country })
    }

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onPlaceSelected])

  return (
    <div className="space-y-2">
      <Label htmlFor="address">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        ref={inputRef}
        id="address"
        name="address"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled || isLoading}
      />
      {isLoading && (
        <p className="text-xs text-muted-foreground">
          Cargando Google Maps...
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive">
          {error}. Puedes ingresar la dirección manualmente.
        </p>
      )}
      {!isLoading && !error && (
        <p className="text-xs text-muted-foreground">
          Empieza a escribir para ver sugerencias
        </p>
      )}
    </div>
  )
}
