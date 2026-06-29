'use client'

import { useEffect, useState, useRef } from 'react'
import {
  DocumentArrowUpIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  InboxIcon,
  XMarkIcon,
  GlobeAltIcon,
  LinkIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import TiendanubeConnect from '@/components/TiendanubeConnect'

interface Document {
  id: string
  name: string
  file_type: string
  file_size: number
  status: 'pending' | 'processing' | 'ready' | 'error'
  chunk_count: number
  source_type: 'file' | 'url'
  source_url: string | null
  created_at: string
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

export default function DocumentsPage() {
  const [tab, setTab] = useState<'file' | 'url'>('file')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tabsSectionRef = useRef<HTMLDivElement>(null)

  const [urlInput, setUrlInput] = useState('')
  const [urlMode, setUrlMode] = useState<'single' | 'full'>('single')
  const [addingUrl, setAddingUrl] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)

  const [tiendanubeParam, setTiendanubeParam] = useState<string | null>(null)

  useEffect(() => {
    setTiendanubeParam(new URLSearchParams(window.location.search).get('tiendanube'))
  }, [])

  function scrollToTabs() {
    tabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

  async function handleAddUrl() {
    setUrlError(null)
    if (!/^https?:\/\/.+/i.test(urlInput.trim())) {
      setUrlError('Ingresá una URL válida (debe empezar con http:// o https://)')
      return
    }

    setAddingUrl(true)
    try {
      const res = await fetch('/api/documents/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim(), mode: urlMode }),
      })
      const data = await res.json()
      if (data.error) {
        setUrlError(data.error)
      } else {
        setUrlInput('')
        await loadDocuments()
      }
    } catch (e) {
      setUrlError('Error al agregar la URL. Verificá que el backend esté corriendo.')
    } finally {
      setAddingUrl(false)
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

  const files = documents.filter((d) => d.source_type !== 'url')
  const urls = documents.filter((d) => d.source_type === 'url')
  const visible = tab === 'file' ? files : urls

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="bg-card border-b border-border px-6 py-3">
        <span className="text-sm font-medium text-foreground">Documentos</span>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          {tiendanubeParam === 'success' && (
            <div className="bg-accent-subtle border border-accent/20 rounded-lg px-4 py-3">
              <p className="text-sm text-accent-on-surface font-medium">Tiendanube conectado correctamente</p>
            </div>
          )}
          {tiendanubeParam === 'error' && (
            <div className="bg-danger-subtle border border-danger/20 rounded-lg px-4 py-3">
              <p className="text-sm text-danger font-medium">No se pudo conectar Tiendanube. Probá de nuevo.</p>
            </div>
          )}

          {/* Conocimiento del bot */}
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-sm font-semibold text-foreground">Conocimiento del bot</h1>
              <p className="text-xs text-subtle-foreground mt-0.5">
                Elegí de dónde saca la información tu asistente para responder.
              </p>
            </div>

            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
            >
              {/* Card A - Tienda online */}
              <Card padding="md" className="border-2 border-accent">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                    style={{ backgroundColor: '#F06000' }}
                  >
                    TN
                  </div>
                  <Badge variant="success" size="sm">En vivo</Badge>
                </div>
                <div className="text-sm font-semibold text-foreground">Tienda online</div>
                <p className="text-xs text-subtle-foreground mt-1">
                  Conectá Tiendanube y el bot responde precios y stock reales, siempre actualizados. Sin cargar nada a mano.
                </p>
                <ul className="flex flex-col gap-1 mt-3">
                  <li className="flex items-center gap-1.5 text-xs text-foreground">
                    <CheckCircleIcon className="w-4 h-4 text-accent-on-surface shrink-0" />
                    Stock y precio en tiempo real
                  </li>
                  <li className="flex items-center gap-1.5 text-xs text-foreground">
                    <CheckCircleIcon className="w-4 h-4 text-accent-on-surface shrink-0" />
                    Cero mantenimiento
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-border">
                  <TiendanubeConnect variant="inline" refreshSignal={tiendanubeParam} />
                </div>
              </Card>

              {/* Card B - Documentos y webs */}
              <Card
                padding="md"
                className="border border-border cursor-pointer hover:border-accent/40 transition-colors duration-200"
                onClick={scrollToTabs}
              >
                <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0 mb-3">
                  <DocumentTextIcon className="w-5 h-5 text-accent-on-surface" />
                </div>
                <div className="text-sm font-semibold text-foreground">Documentos y webs</div>
                <p className="text-xs text-subtle-foreground mt-1">
                  Subí PDFs o pegá el link de tu web. Ideal para info general: envíos, formas de pago, preguntas frecuentes.
                </p>
                <ul className="flex flex-col gap-1 mt-3">
                  <li className="flex items-center gap-1.5 text-xs text-foreground">
                    <ArrowUpTrayIcon className="w-4 h-4 text-subtle-foreground shrink-0" />
                    Subir archivo PDF o Word
                  </li>
                  <li className="flex items-center gap-1.5 text-xs text-foreground">
                    <GlobeAltIcon className="w-4 h-4 text-subtle-foreground shrink-0" />
                    Importar desde una URL
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <div ref={tabsSectionRef} className="flex gap-1 bg-card border border-border rounded-xl p-1 self-start">
            <button
              type="button"
              onClick={() => setTab('file')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                tab === 'file'
                  ? 'bg-accent-subtle text-accent-on-surface'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <DocumentTextIcon className="w-4 h-4" />
              Archivos
            </button>
            <button
              type="button"
              onClick={() => setTab('url')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                tab === 'url'
                  ? 'bg-accent-subtle text-accent-on-surface'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GlobeAltIcon className="w-4 h-4" />
              Sitios web
            </button>
          </div>

          {tab === 'file' ? (
            /* Upload zone */
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
          ) : (
            /* Agregar sitio web */
            <Card padding="md">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center shrink-0">
                  <GlobeAltIcon className="w-6 h-6 text-accent-on-surface" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">Agregar sitio web</div>
                  <div className="text-xs text-subtle-foreground mt-0.5">
                    Pegá la URL de una página y la leemos como fuente de conocimiento
                  </div>
                </div>
              </div>

              <div className="flex gap-1 bg-background border border-border rounded-lg p-1 mb-3 self-start">
                <button
                  type="button"
                  onClick={() => setUrlMode('single')}
                  disabled={addingUrl}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
                    urlMode === 'single'
                      ? 'bg-accent-subtle text-accent-on-surface'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Leer solo esta página
                </button>
                <button
                  type="button"
                  onClick={() => setUrlMode('full')}
                  disabled={addingUrl}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
                    urlMode === 'full'
                      ? 'bg-accent-subtle text-accent-on-surface'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Leer todo el sitio
                </button>
              </div>
              <p className="text-[11px] text-subtle-foreground mb-3">
                {urlMode === 'full'
                  ? 'Vamos a recorrer las páginas principales del sitio — puede tardar varios minutos en quedar listo.'
                  : 'Leemos solo el contenido de la URL que pegues.'}
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !addingUrl) handleAddUrl() }}
                  placeholder="https://tunegocio.com/preguntas-frecuentes"
                  disabled={addingUrl}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-accent transition-colors duration-200"
                />
                <Button onClick={handleAddUrl} disabled={addingUrl} size="sm">
                  {addingUrl ? 'Agregando...' : 'Agregar'}
                </Button>
              </div>
              {urlError && <p className="text-xs text-danger mt-2">{urlError}</p>}
            </Card>
          )}

          {/* Lista de documentos */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                {tab === 'file' ? 'Documentos subidos' : 'Sitios web agregados'}
                {visible.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-subtle-foreground">
                    ({visible.length})
                  </span>
                )}
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-subtle-foreground">Cargando...</span>
              </div>
            ) : visible.length === 0 ? (
              <EmptyState
                icon={tab === 'file' ? InboxIcon : GlobeAltIcon}
                title={tab === 'file' ? 'Todavía no subiste ningún documento' : 'Todavía no agregaste ningún sitio web'}
                description={
                  tab === 'file'
                    ? 'Subí un PDF o TXT con el catálogo, precios o FAQ de tu negocio'
                    : 'Agregá la URL de tu sitio para que el bot responda con esa información'
                }
              />
            ) : (
              <div className="flex flex-col gap-3">
                {visible.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/30 transition-colors duration-200"
                  >
                    <div className="w-9 h-9 rounded-lg bg-card-hover flex items-center justify-center shrink-0">
                      {doc.source_type === 'url' ? (
                        <LinkIcon className="w-4.5 h-4.5 text-muted-foreground" />
                      ) : (
                        <DocumentTextIcon className="w-4.5 h-4.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {doc.source_type === 'url' ? (
                          <span className="text-xs text-subtle-foreground truncate">{doc.source_url}</span>
                        ) : (
                          <span className="text-xs text-subtle-foreground">{formatSize(doc.file_size)}</span>
                        )}
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
                      title="Eliminar"
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
