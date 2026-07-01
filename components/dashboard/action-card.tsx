import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  className?: string
}

export function ActionCard({ title, description, icon: Icon, href, className }: ActionCardProps) {
  return (
    <Button
      variant="outline"
      className="h-auto flex-col items-start gap-3 p-4 transition-all hover:scale-[1.02] hover:shadow-md"
      asChild
    >
      <Link href={href}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4A849]/20">
          <Icon className="h-5 w-5 text-[#D4A849]" />
        </div>
        <div className="text-left w-full">
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground font-normal">
            {description}
          </div>
        </div>
      </Link>
    </Button>
  )
}
