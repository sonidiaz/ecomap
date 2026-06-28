"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, ChevronsUpDown, Plus } from "lucide-react"

interface OrgSelectorProps {
  currentOrgSlug: string
}

export function OrgSelector({ currentOrgSlug }: OrgSelectorProps) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Cambiar Org</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Cambiar Organización</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/organizations')}>
          <Building2 className="mr-2 h-4 w-4" />
          Ver todas las organizaciones
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/organizations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Organización
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
