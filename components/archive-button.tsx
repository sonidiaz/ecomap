"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { archiveCollaborator, unarchiveCollaborator } from "@/lib/collaborator-actions"
import { Archive, ArchiveRestore, Loader2 } from "lucide-react"

interface ArchiveButtonProps {
  collaboratorId: string
  isArchived: boolean
  orgSlug: string
}

export function ArchiveButton({ collaboratorId, isArchived, orgSlug }: ArchiveButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleArchive = async () => {
    setError(null)

    startTransition(async () => {
      try {
        const result = isArchived
          ? await unarchiveCollaborator(collaboratorId)
          : await archiveCollaborator(collaboratorId)

        if (result.error) {
          setError(result.error)
        } else {
          router.push(`/${orgSlug}/collaborators`)
          router.refresh()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al procesar')
      }
    })
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={isArchived ? "default" : "destructive"} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isArchived ? (
              <ArchiveRestore className="h-4 w-4 mr-2" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            {isArchived ? 'Restaurar' : 'Archivar'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArchived ? '¿Restaurar colaborador?' : '¿Archivar colaborador?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArchived ? (
                <>
                  El colaborador volverá a aparecer en la lista principal y en el grafo de red.
                </>
              ) : (
                <>
                  El colaborador se moverá a archivados y dejará de aparecer en el grafo de red.
                  Podrás restaurarlo en cualquier momento desde la sección de archivados.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isPending}>
              {isPending ? 'Procesando...' : isArchived ? 'Restaurar' : 'Archivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <div className="text-sm text-destructive mt-2">
          {error}
        </div>
      )}
    </>
  )
}
