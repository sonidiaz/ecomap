'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Sparkles,
  RefreshCw,
  MinusCircle,
  Copy,
} from 'lucide-react'

interface ImportResult {
  success: boolean
  results: {
    total: number
    created: number
    updated: number
    warnings: number
    skipped: number
    errors: Array<{ row: number; error: string }>
  }
}

type PreviewRowStatus = 'new' | 'updated' | 'unchanged' | 'duplicate' | 'error'

interface PreviewRow {
  row: number
  status: PreviewRowStatus
  name?: string
  email?: string
  changes?: string[]
  error?: string
}

interface PreviewResult {
  success: boolean
  summary: {
    total: number
    new: number
    updated: number
    unchanged: number
    duplicates: number
    errors: number
  }
  rows: PreviewRow[]
}

const STATUS_LABELS: Record<PreviewRowStatus, { label: string; icon: typeof Sparkles; className: string }> = {
  new: { label: 'Nuevo', icon: Sparkles, className: 'bg-green-100 text-green-800' },
  updated: { label: 'Actualizado', icon: RefreshCw, className: 'bg-blue-100 text-blue-800' },
  unchanged: { label: 'Sin cambios', icon: MinusCircle, className: 'bg-gray-100 text-gray-600' },
  duplicate: { label: 'Duplicado', icon: Copy, className: 'bg-yellow-100 text-yellow-800' },
  error: { label: 'Error', icon: XCircle, className: 'bg-red-100 text-red-800' },
}

export default function ImportPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const resetSelection = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(null)
      setResult(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile)
      setPreview(null)
      setResult(null)
    }
  }

  const getOrgId = async () => {
    const orgResponse = await fetch(`/api/organizations/${orgSlug}`)
    const orgData = await orgResponse.json()
    if (!orgData.id) {
      throw new Error('No se pudo obtener el ID de la organización')
    }
    return orgData.id as string
  }

  const handleAnalyze = async () => {
    if (!file) return

    setIsAnalyzing(true)
    try {
      const orgId = await getOrgId()

      const formData = new FormData()
      formData.append('file', file)
      formData.append('orgId', orgId)

      const response = await fetch('/api/import/preview', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al analizar el archivo')
      }

      const data: PreviewResult = await response.json()
      setPreview(data)
    } catch (error: any) {
      console.error('Preview error:', error)
      setPreview({
        success: false,
        summary: { total: 0, new: 0, updated: 0, unchanged: 0, duplicates: 0, errors: 0 },
        rows: [{ row: 0, status: 'error', error: error.message }],
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const orgId = await getOrgId()

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('orgId', orgId)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al importar')
      }

      const data: ImportResult = await response.json()
      setResult(data)
      setFile(null)
      setPreview(null)

      // Si fue exitoso, redirigir al grafo después de 3 segundos
      if (data.success && (data.results.created > 0 || data.results.updated > 0)) {
        setTimeout(() => {
          router.push(`/${orgSlug}/graph`)
        }, 3000)
      }
    } catch (error: any) {
      console.error('Import error:', error)
      setResult({
        success: false,
        results: {
          total: 0,
          created: 0,
          updated: 0,
          warnings: 0,
          skipped: 0,
          errors: [{ row: 0, error: error.message }],
        },
      })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    window.open('/api/template', '_blank')
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Importar Colaboradores</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Carga múltiples colaboradores desde un archivo Excel
          </p>
        </div>

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle>Cómo importar</CardTitle>
            <CardDescription>Sigue estos pasos para importar tus colaboradores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Descarga la plantilla</p>
                <p className="text-sm text-muted-foreground">
                  Usa nuestra plantilla Excel con el formato correcto
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={downloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Plantilla
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Rellena tus datos</p>
                <p className="text-sm text-muted-foreground">
                  Completa la información de tus colaboradores. Los campos obligatorios son: nombre, email y dirección.
                  Si ya importaste antes, puedes volver a subir el mismo archivo actualizado: los colaboradores
                  existentes (por email) se actualizan y los nuevos se añaden, sin borrar a nadie.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Sube el archivo y revisa la vista previa</p>
                <p className="text-sm text-muted-foreground">
                  Antes de confirmar, verás qué filas son nuevas, cuáles se actualizan y cuáles tienen errores.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
        {!result && (
          <Card>
            <CardHeader>
              <CardTitle>Subir Archivo</CardTitle>
              <CardDescription>Selecciona o arrastra tu archivo Excel (.xlsx)</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {file ? (
                  <div className="space-y-2">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-green-500" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        resetSelection()
                      }}
                    >
                      Cambiar archivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="font-medium">Arrastra tu archivo aquí</p>
                    <p className="text-sm text-muted-foreground">
                      o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formato: .xlsx (máximo 10MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                id="file-input"
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileChange}
              />

              {file && !preview && !isAnalyzing && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleAnalyze} size="lg">
                    <Search className="mr-2 h-4 w-4" />
                    Analizar archivo
                  </Button>
                </div>
              )}

              {isAnalyzing && (
                <p className="mt-4 text-sm text-center text-muted-foreground">
                  Analizando archivo y comparando con tus colaboradores actuales...
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {preview && !isUploading && !result && (
          <Card>
            <CardHeader>
              <CardTitle>Vista previa de la importación</CardTitle>
              <CardDescription>
                Revisa los cambios antes de confirmar. Nada se guarda todavía.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{preview.summary.new}</p>
                  <p className="text-xs text-muted-foreground">Nuevos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{preview.summary.updated}</p>
                  <p className="text-xs text-muted-foreground">Actualizados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-500">{preview.summary.unchanged}</p>
                  <p className="text-xs text-muted-foreground">Sin cambios</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{preview.summary.duplicates}</p>
                  <p className="text-xs text-muted-foreground">Duplicados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{preview.summary.errors}</p>
                  <p className="text-xs text-muted-foreground">Errores</p>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-1 border rounded-lg divide-y">
                {preview.rows.map((row) => {
                  const meta = STATUS_LABELS[row.status]
                  const Icon = meta.icon
                  return (
                    <div key={row.row} className="flex items-center justify-between gap-3 p-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge className={meta.className}>
                          <Icon className="mr-1 h-3 w-3" />
                          {meta.label}
                        </Badge>
                        <span className="font-medium truncate">
                          {row.name || `Fila ${row.row}`}
                        </span>
                        {row.email && (
                          <span className="text-muted-foreground truncate">{row.email}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground text-right">
                        {row.error || row.changes?.join(', ')}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={resetSelection}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={preview.summary.new + preview.summary.updated === 0}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Confirmar importación
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress */}
        {isUploading && (
          <Card>
            <CardHeader>
              <CardTitle>Importando...</CardTitle>
              <CardDescription>Por favor espera mientras procesamos el archivo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-muted-foreground">
                {uploadProgress < 90
                  ? 'Subiendo y procesando...'
                  : 'Geocodificando direcciones y calculando scores...'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Importación Completada
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    Error en la Importación
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{result.results.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {result.results.created}
                  </p>
                  <p className="text-sm text-muted-foreground">Creados</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {result.results.updated}
                  </p>
                  <p className="text-sm text-muted-foreground">Actualizados</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {result.results.skipped}
                  </p>
                  <p className="text-sm text-muted-foreground">Omitidos</p>
                </div>
              </div>

              {/* Warnings */}
              {result.results.warnings > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Advertencias de geocodificación</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    {result.results.warnings} colaborador(es) se importaron pero su dirección no pudo
                    geocodificarse. Puedes corregirla manualmente desde su ficha.
                  </AlertDescription>
                </Alert>
              )}

              {/* Errors */}
              {result.results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Errores encontrados</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {result.results.errors.map((error, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">Fila {error.row}:</span> {error.error}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success message */}
              {result.success && (result.results.created > 0 || result.results.updated > 0) && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">¡Éxito!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Se crearon {result.results.created} y se actualizaron {result.results.updated} colaboradores.
                    Redirigiendo al grafo de red...
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={() => router.push(`/${orgSlug}/graph`)}>
                  Ver Grafo de Red
                </Button>
                <Button variant="outline" onClick={resetSelection}>
                  Importar más
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
