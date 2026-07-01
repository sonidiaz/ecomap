import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface DashboardGridProps {
  cols?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
  }
  gap?: number
  children: ReactNode
  className?: string
}

export function DashboardGrid({
  cols = { base: 1, md: 2, lg: 3 },
  gap = 6,
  children,
  className
}: DashboardGridProps) {
  const gridClasses = cn(
    "grid",
    {
      "grid-cols-1": cols.base === 1,
      "grid-cols-2": cols.base === 2,
      "grid-cols-3": cols.base === 3,
    },
    cols.sm && {
      "sm:grid-cols-1": cols.sm === 1,
      "sm:grid-cols-2": cols.sm === 2,
      "sm:grid-cols-3": cols.sm === 3,
    },
    cols.md && {
      "md:grid-cols-1": cols.md === 1,
      "md:grid-cols-2": cols.md === 2,
      "md:grid-cols-3": cols.md === 3,
    },
    cols.lg && {
      "lg:grid-cols-1": cols.lg === 1,
      "lg:grid-cols-2": cols.lg === 2,
      "lg:grid-cols-3": cols.lg === 3,
    },
    `gap-${gap}`,
    className
  )

  return <div className={gridClasses}>{children}</div>
}
