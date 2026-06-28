import Link from "next/link"
import { OrgRole } from "@prisma/client"
import { signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, Home, Users, Upload, Settings, LogOut, Layers } from "lucide-react"
import { OrgSelector } from "@/components/org-selector"

interface OrgHeaderProps {
  org: {
    name: string
    slug: string
    logo?: string | null
  }
  userRole: OrgRole
  user: {
    name: string
    email: string
    image: string | null
  }
}

export function OrgHeader({ org, userRole, user }: OrgHeaderProps) {
  const isAdmin = userRole === 'ADMIN'

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="flex h-16 items-center gap-6 px-6">
        {/* Org Logo/Name */}
        <div className="flex items-center gap-3">
          {org.logo ? (
            <img src={org.logo} alt={org.name} className="h-8 w-8 rounded" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-semibold leading-none">{org.name}</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${org.slug}`}>
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${org.slug}/collaborators`}>
              <Building2 className="mr-2 h-4 w-4" />
              Colaboradores
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${org.slug}/graph`}>
              <Layers className="mr-2 h-4 w-4" />
              Grafo
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${org.slug}/import`}>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${org.slug}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </Button>
          )}
        </nav>

        {/* Right side: Org Selector + User Menu */}
        <div className="flex items-center gap-3">
          <OrgSelector currentOrgSlug={org.slug} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback>
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/organizations">
                  <Building2 className="mr-2 h-4 w-4" />
                  Mis Organizaciones
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form
                  action={async () => {
                    "use server"
                    await signOut({ redirectTo: "/login" })
                  }}
                >
                  <button type="submit" className="flex w-full items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
