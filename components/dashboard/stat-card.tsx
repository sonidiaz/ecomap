import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  description: string
  icon: LucideIcon
  href?: string
  variant?: 'default' | 'accent' | 'minimal'
  className?: string
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  href,
  variant = 'default',
  className
}: StatCardProps) {
  const content = (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-4xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4A849]/20">
            <Icon className="h-5 w-5 text-[#D4A849]" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block transition-transform hover:scale-[1.02]">
        {content}
      </Link>
    )
  }

  return content
}
