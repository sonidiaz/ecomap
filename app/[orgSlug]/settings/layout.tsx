import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SettingsLayoutProps {
  children: React.ReactNode
  params: Promise<{
    orgSlug: string
  }>
}

export default async function SettingsLayout({ children, params }: SettingsLayoutProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const { orgSlug } = await params

  // Fetch organization and verify user access
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      members: {
        where: { userId: session.user.id }
      }
    }
  })

  if (!org) {
    notFound()
  }

  // Check if user has access
  if (org.members.length === 0) {
    redirect('/organizations')
  }

  const membership = org.members[0]

  // Only ADMIN can access settings
  if (membership.role !== 'ADMIN') {
    redirect(`/${orgSlug}`)
  }

  const tabs = [
    { name: 'General', href: `/${orgSlug}/settings` },
    { name: 'Miembros', href: `/${orgSlug}/settings/members` },
  ]

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Configuración</h1>
          <p className="mt-2 text-muted-foreground">
            Gestiona la configuración de tu organización
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = false // Will be handled by client component or pathname check
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={cn(
                    "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors",
                    "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  {tab.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Tab content */}
        {children}
      </div>
    </div>
  )
}
