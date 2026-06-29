"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Orbit } from "@prisma/client"

interface GraphControlsProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  orbitFilters: Set<Orbit>
  onOrbitToggle: (orbit: Orbit) => void
  visibleCount: number
  totalCount: number
}

export function GraphControls({
  searchTerm,
  onSearchChange,
  orbitFilters,
  onOrbitToggle,
  visibleCount,
  totalCount,
}: GraphControlsProps) {
  const orbits: { value: Orbit; label: string; color: string }[] = [
    { value: 'CORE', label: 'Core', color: 'bg-green-500 hover:bg-green-600' },
    { value: 'MID', label: 'Mid', color: 'bg-yellow-500 hover:bg-yellow-600' },
    { value: 'PERIPHERY', label: 'Periphery', color: 'bg-gray-400 hover:bg-gray-500' },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border-b">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar colaborador..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros de órbita */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Filtros:</span>
          {orbits.map(({ value, label, color }) => {
            const isActive = orbitFilters.has(value)
            return (
              <Button
                key={value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onOrbitToggle(value)}
                className={`
                  ${isActive ? color : ''}
                  transition-all
                `}
              >
                {label}
              </Button>
            )
          })}
        </div>

        {/* Contador */}
        <Badge variant="secondary" className="text-sm">
          {visibleCount} de {totalCount} colaboradores
        </Badge>
      </div>
    </div>
  )
}
