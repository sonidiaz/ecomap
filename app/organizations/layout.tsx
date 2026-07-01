import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Redirect non-authenticated users to login
  if (!session?.user) {
    redirect('/login')
  }

  return <>{children}</>
}
