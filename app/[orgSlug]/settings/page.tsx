import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { OrgSettingsForm } from "@/components/org-settings-form"

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

  return (
    <OrgSettingsForm
      org={{
        slug: org.slug,
        name: org.name,
        description: org.description,
      }}
    />
  )
}
