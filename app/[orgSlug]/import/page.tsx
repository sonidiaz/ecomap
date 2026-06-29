'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Download, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface ImportResult {
  success: boolean
  results: {
    total: number
    imported: number
    skipped: number
    errors: Array<{ row: number; error: string }>
  }
}

export default function ImportPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Obtener orgId desde el servidor
      const orgResponse = await fetch(`/api/organizations/${orgSlug}`)
      const orgData = await orgResponse.json()

      if (!orgData.id) {
        throw new Error('No se pudo obtener el ID de la organización')
      }

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('orgId', orgData.id)

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

      // Si fue exitoso, redirigir al grafo después de 3 segundos
      if (data.success && data.results.imported > 0) {
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
          imported: 0,
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
                  className="mt-"
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
                  Completa la información de tus colaboradores. Los campos obligatorios son: nombre, email y dirección
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Sube el archivo</p>
                <p className="text-sm text-muted-foreground">
                  Arrastra el archivo aquí o haz clic para seleccionarlo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Area */}
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
                      setFile(null)
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

            {file && !isUploading && (
              <div className="mt-4 flex justify-end">
                <Button className="text-white" onClick={handleImport} size="lg">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar {file.name}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{result.results.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {result.results.imported}
                  </p>
                  <p className="text-sm text-muted-foreground">Importados</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {result.results.skipped}
                  </p>
                  <p className="text-sm text-muted-foreground">Omitidos</p>
                </div>
              </div>

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
              {result.success && result.results.imported > 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">¡Éxito!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Se importaron {result.results.imported} colaboradores correctamente.
                    Redirigiendo al grafo de red...
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={() => router.push(`/${orgSlug}/graph`)}>
                  Ver Grafo de Red
                </Button>
                <Button variant="outline" onClick={() => setResult(null)}>
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
