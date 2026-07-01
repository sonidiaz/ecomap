import { Card, CardContent } from "@/components/ui/card"

export function StatCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-10 w-16 bg-muted rounded" />
            <div className="h-3 w-32 bg-muted rounded" />
          </div>
          <div className="h-12 w-12 bg-[#D4A849]/20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}
