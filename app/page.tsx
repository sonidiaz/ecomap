import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Check if user has organizations
  const orgCount = await prisma.orgMember.count({
    where: { userId: session.user.id }
  })

  // Always redirect to organizations list where they can select/create org
  redirect('/organizations')
}
