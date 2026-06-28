import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Bienvenido a EcoMap</h1>
            <p className="mt-2 text-gray-600">Hola, {session.user.name}</p>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <Button type="submit" variant="outline">
              Cerrar Sesión
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Proyecto</CardTitle>
            <CardDescription>
              Configuración inicial completada - Fase 0
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-green-600">✓ Completado</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Next.js 15 + TypeScript</li>
                  <li>• Prisma + Schema completo</li>
                  <li>• NextAuth.js v5</li>
                  <li>• shadcn/ui components</li>
                  <li>• Plantilla Excel</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-blue-600">→ Siguiente</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Configurar base de datos Neon</li>
                  <li>• Añadir credenciales Google OAuth</li>
                  <li>• Crear primera organización</li>
                  <li>• Implementar CRUD colaboradores</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración Pendiente</CardTitle>
            <CardDescription>
              Pasos necesarios antes de continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-sm">
                <strong>1. Base de Datos:</strong> Crear base de datos en{" "}
                <a
                  href="https://neon.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  neon.tech
                </a>{" "}
                y actualizar DATABASE_URL en .env
              </p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-sm">
                <strong>2. Google OAuth:</strong> Crear credenciales en{" "}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Google Cloud Console
                </a>{" "}
                y añadir GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env
              </p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-sm">
                <strong>3. Google Places API:</strong> Habilitar Places API y añadir
                GOOGLE_PLACES_API_KEY en .env
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
