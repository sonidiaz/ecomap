import { Card } from "@/components/ui/card"

export function ActionCardSkeleton() {
  return (
    <Card className="animate-pulse h-auto p-4">
      <div className="flex flex-col gap-3">
        <div className="h-10 w-10 bg-[#D4A849]/20 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-3 w-40 bg-muted rounded" />
        </div>
      </div>
    </Card>
  )
}
