'use client'

import { useEffect, useState, useRef } from 'react'

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
      pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600' },
      processing: { label: 'Procesando...', color: 'bg-amber-50 text-amber-600' },
      ready: { label: 'Listo', color: 'bg-emerald-50 text-emerald-600' },
      error: { label: 'Error', color: 'bg-red-50 text-red-600' },
    }
    const { label, color } = map[status] ?? map.pending
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
        {status === 'processing' && (
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1 animate-pulse" />
        )}
        {label}
      </span>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <span className="text-sm font-medium text-gray-700">Documentos</span>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
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
            className={`bg-white rounded-xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
              dragOver
                ? 'border-[#10B981] bg-emerald-50'
                : 'border-gray-200 hover:border-[#10B981]'
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
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl">
              {uploading ? '⏳' : '📄'}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {uploading ? 'Subiendo y procesando...' : 'Arrastrá o hacé click para subir'}
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF o TXT — máximo 10MB</p>
            </div>
            {!uploading && (
              <button className="mt-2 px-4 py-2 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669] transition-colors">
                Elegir archivo
              </button>
            )}
          </div>

          {/* Lista de documentos */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Documentos subidos
                {documents.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({documents.length})
                  </span>
                )}
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-gray-400">Cargando...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <span className="text-2xl">📭</span>
                <p className="text-sm text-gray-400">Todavía no subiste ningún documento</p>
                <p className="text-xs text-gray-300">
                  Subí un PDF o TXT con el catálogo, precios o FAQ de tu negocio
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-lg shrink-0">
                      {doc.file_type === 'application/pdf' ? '📕' : '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{formatSize(doc.file_size)}</span>
                        {doc.status === 'ready' && doc.chunk_count > 0 && (
                          <>
                            <span className="text-gray-200">·</span>
                            <span className="text-xs text-gray-400">{doc.chunk_count} chunks</span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                    <button
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                      title="Eliminar documento"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}