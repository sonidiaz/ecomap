"use client"

import { useState } from "react"
import { updateMemberRole, removeMember } from "@/lib/member-actions"
import { formatRole, getRoleBadgeColor } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { OrgRole } from "@prisma/client"

interface Member {
  id: string
  role: OrgRole
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

interface MemberTableProps {
  members: Member[]
  orgSlug: string
  currentUserId: string
}

export function MemberTable({ members, orgSlug, currentUserId }: MemberTableProps) {
  const router = useRouter()
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<string | null>(null)

  async function handleRoleChange(memberId: string, newRole: OrgRole) {
    setUpdatingRole(memberId)
    try {
      await updateMemberRole(orgSlug, memberId, newRole)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar rol')
    } finally {
      setUpdatingRole(null)
    }
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingMember(memberId)
    try {
      await removeMember(orgSlug, memberId)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al remover miembro')
    } finally {
      setRemovingMember(null)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Miembro</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Desde</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isCurrentUser = member.user.id === currentUserId
            const isUpdating = updatingRole === member.id
            const isRemoving = removingMember === member.id

            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {member.user.image && (
                      <img
                        src={member.user.image}
                        alt={member.user.name || ''}
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">
                        {member.user.name || 'Sin nombre'}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-muted-foreground">(Tú)</span>
                        )}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{member.user.email}</TableCell>
                <TableCell>
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.id, value as OrgRole)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {formatRole(member.role)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="EDITOR">Editor</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(member.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isRemoving}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Remover miembro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {isCurrentUser ? (
                            'Estás a punto de removerte de esta organización. Perderás acceso inmediatamente.'
                          ) : (
                            `¿Estás seguro de que quieres remover a ${member.user.name || member.user.email}? Esta acción no se puede deshacer.`
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveMember(member.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {members.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No hay miembros en esta organización
        </div>
      )}
    </div>
  )
}
