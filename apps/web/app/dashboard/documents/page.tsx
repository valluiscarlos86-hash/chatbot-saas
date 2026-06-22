'use client'

import { useEffect, useState, useRef } from 'react'
import { DocumentArrowUpIcon, ArrowPathIcon, DocumentTextIcon, InboxIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

interface Document {
  id: string
  name: string
  file_type: string
  file_size: number
  status: 'pending' | 'processing' | 'ready' | 'error'
  chunk_count: number
  created_at: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadDocuments() {
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error cargando documentos:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  // Polling para actualizar estado de documentos en procesamiento
  useEffect(() => {
    const procesando = documents.some(
      (d) => d.status === 'pending' || d.status === 'processing'
    )
    if (!procesando) return
    const interval = setInterval(loadDocuments, 3000)
    return () => clearInterval(interval)
  }, [documents])

  async function handleUpload(file: File) {
    if (!file) return

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('El archivo supera los 10MB permitidos.')
      return
    }

    const allowed = ['application/pdf', 'text/plain']
    if (!allowed.includes(file.type)) {
      alert('Solo se permiten archivos PDF o TXT.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.error) {
        alert(`Error: ${data.error}`)
      } else {
        await loadDocuments()
      }
    } catch (e) {
      alert('Error al subir el archivo. Verificá que el backend esté corriendo.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? También se borrarán todos sus embeddings.`)) return
    try {
      await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (e) {
      alert('Error al eliminar el documento.')
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function StatusBadge({ status }: { status: Document['status'] }) {
    const map = {
      pending: { label: 'Pendiente', variant: 'neutral' as const },
      processing: { label: 'Procesando...', variant: 'warning' as const },
      ready: { label: 'Listo', variant: 'success' as const },
      error: { label: 'Error', variant: 'danger' as const },
    }
    const { label, variant } = map[status] ?? map.pending
    return <Badge variant={variant} pulse={status === 'processing'}>{label}</Badge>
  }

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="bg-card border-b border-border px-6 py-3">
        <span className="text-sm font-medium text-foreground">Documentos</span>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer.files[0]
              if (file) handleUpload(file)
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`bg-card rounded-xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors duration-200 ${
              dragOver
                ? 'border-accent bg-accent-subtle'
                : 'border-border hover:border-accent/50'
            } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
                e.target.value = ''
              }}
            />
            <div className="w-12 h-12 rounded-full bg-accent-subtle flex items-center justify-center">
              {uploading ? (
                <ArrowPathIcon className="w-6 h-6 text-accent-on-surface animate-spin" />
              ) : (
                <DocumentArrowUpIcon className="w-6 h-6 text-accent-on-surface" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {uploading ? 'Subiendo y procesando...' : 'Arrastrá o hacé click para subir'}
              </p>
              <p className="text-xs text-subtle-foreground mt-1">PDF o TXT — máximo 10MB</p>
            </div>
            {!uploading && (
              <button
                type="button"
                className="mt-2 px-4 py-2 bg-accent text-accent-foreground text-xs font-medium rounded-lg hover:bg-accent-hover transition-colors duration-200 active:scale-[0.97]"
              >
                Elegir archivo
              </button>
            )}
          </div>

          {/* Lista de documentos */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                Documentos subidos
                {documents.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-subtle-foreground">
                    ({documents.length})
                  </span>
                )}
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-subtle-foreground">Cargando...</span>
              </div>
            ) : documents.length === 0 ? (
              <EmptyState
                icon={InboxIcon}
                title="Todavía no subiste ningún documento"
                description="Subí un PDF o TXT con el catálogo, precios o FAQ de tu negocio"
              />
            ) : (
              <div className="flex flex-col gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/30 transition-colors duration-200"
                  >
                    <div className="w-9 h-9 rounded-lg bg-card-hover flex items-center justify-center shrink-0">
                      <DocumentTextIcon className="w-4.5 h-4.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-subtle-foreground">{formatSize(doc.file_size)}</span>
                        {doc.status === 'ready' && doc.chunk_count > 0 && (
                          <>
                            <span className="text-border">·</span>
                            <span className="text-xs text-subtle-foreground">{doc.chunk_count} chunks</span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                    <button
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-subtle-foreground hover:text-danger hover:bg-danger-subtle transition-colors duration-200 active:scale-[0.97] shrink-0"
                      title="Eliminar documento"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  )
}
