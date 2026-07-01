"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CollaboratorSearchBarProps {
  onSearchChange: (searchTerm: string) => void
  placeholder?: string
}

export function CollaboratorSearchBar({
  onSearchChange,
  placeholder = "Buscar por nombre, email, empresa o etiquetas...",
}: CollaboratorSearchBarProps) {
  const [localValue, setLocalValue] = useState("")

  // Debounce the search to avoid excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localValue)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [localValue, onSearchChange])

  const handleClear = () => {
    setLocalValue("")
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-10 pr-10"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
