/**
 * Servicio de geocodificación usando Google Places API
 */

interface GeocodeResult {
  lat: number
  lng: number
  city?: string
  country?: string
  formattedAddress?: string
}

/**
 * Geocodifica una dirección usando Google Places API
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY not configured, skipping geocoding')
    return null
  }

  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results?.[0]) {
      console.warn(`Geocoding failed for address: ${address}, status: ${data.status}`)
      return null
    }

    const result = data.results[0]
    const location = result.geometry.location

    // Extraer ciudad y país de los componentes
    let city: string | undefined
    let country: string | undefined

    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        city = component.long_name
      }
      if (component.types.includes('country')) {
        country = component.long_name
      }
    }

    return {
      lat: location.lat,
      lng: location.lng,
      city,
      country,
      formattedAddress: result.formatted_address,
    }
  } catch (error) {
    console.error('Error geocoding address:', error)
    return null
  }
}

/**
 * Calcula la distancia entre dos puntos en km usando la fórmula de Haversine
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}
