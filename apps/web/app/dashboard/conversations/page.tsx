'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

interface Conversation {
  id: string
  customer_phone: string
  customer_name: string | null
  status: 'bot_active' | 'human_takeover' | 'closed'
  updated_at: string
  created_at: string
  last_message: string | null
  last_message_role: 'user' | 'assistant' | null
  metadata: { internal_note?: string } | null
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

type Filter = 'all' | 'open' | 'closed'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Todos',
  open: 'Abierto',
  closed: 'Cerrado',
}

const STATUS_STYLE: Record<Conversation['status'], { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  bot_active: { label: 'Bot activo', variant: 'success' },
  human_takeover: { label: 'Agente', variant: 'warning' },
  closed: { label: 'Cerrada', variant: 'neutral' },
}

function StatusBadge({ status }: { status: Conversation['status'] }) {
  const { label, variant } = STATUS_STYLE[status]
  return <Badge variant={variant} className="shrink-0">{label}</Badge>
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const diffHours = (Date.now() - date.getTime()) / 3_600_000
  if (diffHours < 24) return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

export default function ConversationsPage() {
  // Left panel
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [convSearch, setConvSearch] = useState('')

  // Right panel
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageSearch, setMessageSearch] = useState('')
  const [infoOpen, setInfoOpen] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const [agentInput, setAgentInput] = useState('')
  const [sendingAgent, setSendingAgent] = useState(false)
  const [noteValue, setNoteValue] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => { setConversations(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Fetch messages and reset right-panel state when conversation changes
  useEffect(() => {
    if (!selectedId) { setMessages([]); return }
    setMessagesLoading(true)
    setMessages([])
    setInfoOpen(false)
    setAgentInput('')
    setMessageSearch('')
    setSummary(null)
    setSummaryLoading(false)
    fetch(`/api/conversations/${selectedId}/messages`)
      .then(r => r.json())
      .then(data => { setMessages(Array.isArray(data) ? data : []); setMessagesLoading(false) })
      .catch(() => setMessagesLoading(false))
  }, [selectedId])

  // Sync note textarea with selected conversation (only on selection change)
  const selectedConv = conversations.find(c => c.id === selectedId) ?? null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setNoteValue(selectedConv?.metadata?.internal_note ?? '') }, [selectedConv?.id])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const filteredConvs = conversations.filter(c => {
    if (filter === 'open' && c.status === 'closed') return false
    if (filter === 'closed' && c.status !== 'closed') return false
    if (convSearch) {
      const q = convSearch.toLowerCase()
      return c.customer_phone.includes(q) || (c.customer_name?.toLowerCase().includes(q) ?? false)
    }
    return true
  })

  const visibleMessages = messageSearch
    ? messages.filter(m => m.content.toLowerCase().includes(messageSearch.toLowerCase()))
    : messages

  async function handleStatusChange(newStatus: Conversation['status']) {
    if (!selectedId || changingStatus) return
    setChangingStatus(true)
    try {
      const res = await fetch(`/api/conversations/${selectedId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!data.error) {
        setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, status: newStatus } : c))
        const msgRes = await fetch(`/api/conversations/${selectedId}/messages`)
        const msgData = await msgRes.json()
        setMessages(Array.isArray(msgData) ? msgData : [])
      }
    } finally {
      setChangingStatus(false)
    }
  }

  async function handleSendAgentMessage() {
    const content = agentInput.trim()
    if (!content || sendingAgent || !selectedId) return
    setSendingAgent(true)
    try {
      const res = await fetch(`/api/conversations/${selectedId}/agent-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (!data.error) {
        setAgentInput('')
        setMessages(prev => [...prev, data])
        setConversations(prev => prev.map(c =>
          c.id === selectedId
            ? { ...c, last_message: content, last_message_role: 'assistant', updated_at: new Date().toISOString() }
            : c
        ))
      }
    } finally {
      setSendingAgent(false)
    }
  }

  async function handleSaveNote() {
    if (!selectedId) return
    setSavingNote(true)
    try {
      await fetch(`/api/conversations/${selectedId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal_note: noteValue }),
      })
    } finally {
      setSavingNote(false)
    }
  }

  function handleAgentKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAgentMessage() }
  }

  async function handleGenerateSummary() {
    if (summaryLoading || !selectedId) return
    if (summary !== null) { setSummary(null); return }

    const hasContent = messages.some(m => m.role === 'user' || m.role === 'assistant')
    if (!hasContent) { setSummary('No hay suficiente contenido para resumir.'); return }

    setSummaryLoading(true)
    setSummary('')
    try {
      const res = await fetch(`/api/conversations/${selectedId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      setSummary(data.summary || 'No se pudo generar el resumen.')
    } catch {
      setSummary('Error al generar el resumen.')
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <div className="flex h-full">

      {/* PANEL IZQUIERDO */}
      <div className="w-72 min-w-72 border-r border-border bg-card flex flex-col">

        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Conversaciones</span>
          {conversations.length > 0 && <span className="text-xs text-subtle-foreground">{conversations.length}</span>}
        </div>

        <div className="px-3 py-3 border-b border-border">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-subtle-foreground pointer-events-none" />
            <input
              type="text"
              value={convSearch}
              onChange={e => setConvSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-accent transition-colors duration-200"
            />
          </div>
        </div>

        <div className="px-3 py-2 border-b border-border flex gap-1.5 flex-wrap">
          {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 active:scale-[0.97] ${
                filter === f ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-card-hover'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <span className="text-xs text-subtle-foreground">Cargando...</span>
            </div>
          ) : filteredConvs.length === 0 ? (
            <EmptyState
              className="py-10 px-4"
              icon={conversations.length === 0 ? ChatBubbleLeftRightIcon : MagnifyingGlassIcon}
              title={conversations.length === 0 ? 'No hay conversaciones todavía' : 'Sin resultados para este filtro'}
              description={conversations.length === 0 ? 'Conectá WhatsApp para empezar' : undefined}
            />
          ) : (
            filteredConvs.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-card-hover transition-colors duration-200 border-l-2 ${
                  selectedId === conv.id ? 'bg-accent-subtle border-l-accent' : 'border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {conv.customer_name || conv.customer_phone}
                    </p>
                    {conv.customer_name && (
                      <p className="text-xs text-subtle-foreground truncate">{conv.customer_phone}</p>
                    )}
                    {conv.last_message && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.last_message_role === 'assistant' && <span className="text-subtle-foreground">Bot: </span>}
                        {conv.last_message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs text-subtle-foreground">{formatTime(conv.updated_at)}</span>
                    <StatusBadge status={conv.status} />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

      </div>

      {/* PANEL DERECHO */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        {!selectedId ? (
          <EmptyState
            className="flex-1 justify-center"
            icon={ChatBubbleLeftRightIcon}
            title="Seleccioná una conversación"
            description="Elegí un chat de la lista para ver el historial completo."
          />
        ) : (
          <>
            {/* Header */}
            <div className="bg-card border-b border-border px-5 py-3 flex items-center justify-between shrink-0">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selectedConv?.customer_name || selectedConv?.customer_phone}
                </p>
                {selectedConv?.customer_name && (
                  <p className="text-xs text-subtle-foreground">{selectedConv.customer_phone}</p>
                )}
              </div>
              {selectedConv && <StatusBadge status={selectedConv.status} />}
            </div>

            {/* Action bar */}
            <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-2 shrink-0">
              {/* Status actions */}
              {selectedConv?.status === 'bot_active' && (
                <button
                  onClick={() => handleStatusChange('human_takeover')}
                  disabled={changingStatus}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-warning-subtle text-warning hover:bg-warning/15 transition-colors duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 whitespace-nowrap"
                >
                  Tomar control
                </button>
              )}
              {(selectedConv?.status === 'human_takeover' || selectedConv?.status === 'closed') && (
                <button
                  onClick={() => handleStatusChange('bot_active')}
                  disabled={changingStatus}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-subtle text-accent-on-surface hover:bg-accent/15 transition-colors duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 whitespace-nowrap"
                >
                  Reactivar bot
                </button>
              )}
              {selectedConv?.status !== 'closed' && (
                <button
                  onClick={() => handleStatusChange('closed')}
                  disabled={changingStatus}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-card-hover text-muted-foreground hover:bg-border transition-colors duration-200 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 whitespace-nowrap"
                >
                  Cerrar
                </button>
              )}

              <div className="flex-1" />

              {/* Message search */}
              <div className="relative">
                <input
                  type="text"
                  value={messageSearch}
                  onChange={e => setMessageSearch(e.target.value)}
                  placeholder="Buscar en mensajes..."
                  className="bg-background border border-border rounded-lg pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-accent w-44 transition-colors duration-200"
                />
                <MagnifyingGlassIcon className="absolute left-2 top-2 w-3.5 h-3.5 text-subtle-foreground pointer-events-none" />
              </div>

              {/* Resumen IA */}
              <button
                onClick={handleGenerateSummary}
                disabled={summaryLoading}
                title="Resumen con IA"
                className={`p-1.5 rounded-lg transition-colors duration-200 active:scale-[0.97] disabled:opacity-50 ${
                  summary !== null ? 'bg-accent text-accent-foreground' : 'text-subtle-foreground hover:bg-card-hover hover:text-foreground'
                }`}
              >
                <SparklesIcon className={`w-4 h-4 ${summaryLoading ? 'animate-pulse' : ''}`} />
              </button>

              {/* Info toggle */}
              <button
                onClick={() => setInfoOpen(o => !o)}
                title="Info del contacto"
                className={`p-1.5 rounded-lg transition-colors duration-200 active:scale-[0.97] ${
                  infoOpen ? 'bg-accent text-accent-foreground' : 'text-subtle-foreground hover:bg-card-hover hover:text-foreground'
                }`}
              >
                <InformationCircleIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Cuadro de resumen IA */}
            {summary !== null && (
              <div className="mx-5 mt-3 shrink-0 bg-accent-subtle border border-accent/20 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <SparklesIcon className={`w-4 h-4 text-accent-on-surface shrink-0 mt-0.5 ${summaryLoading ? 'animate-pulse' : ''}`} />
                    <p className="text-sm text-foreground leading-relaxed">
                      {summaryLoading ? 'Generando resumen...' : summary}
                    </p>
                  </div>
                  {!summaryLoading && (
                    <button
                      onClick={() => setSummary(null)}
                      className="text-subtle-foreground hover:text-foreground transition-colors duration-200 shrink-0"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Main area: messages + optional info panel */}
            <div className="flex-1 flex min-h-0">

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <span className="text-sm text-subtle-foreground">Cargando mensajes...</span>
                  </div>
                ) : visibleMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <span className="text-sm text-subtle-foreground">
                      {messageSearch ? 'Sin resultados para esa búsqueda' : 'No hay mensajes en esta conversación'}
                    </span>
                  </div>
                ) : (
                  visibleMessages.map((msg, i) => {
                    if (msg.role === 'system') {
                      // La nota de traspaso que escribe el asistente al derivar
                      // ocupa varias lineas. Se muestra como nota interna, no
                      // como el cartelito de un evento suelto, y se aclara que
                      // no se le envio al cliente.
                      if (msg.content.startsWith('Derivada automáticamente')) {
                        return (
                          <div key={msg.id} className="flex justify-center my-3">
                            <div className="w-full max-w-[85%] rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-3 dark:bg-amber-950/30">
                              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                                Nota interna · no se envió al cliente
                              </div>
                              <div className="whitespace-pre-line text-xs text-foreground">
                                {msg.content}
                              </div>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={msg.id} className="flex justify-center my-1">
                          <span className="text-xs text-muted-foreground bg-card-hover px-3 py-1 rounded-full">
                            {msg.content}
                          </span>
                        </div>
                      )
                    }

                    const isUser = msg.role === 'user'
                    const showDate =
                      i === 0 ||
                      new Date(msg.created_at).toDateString() !==
                        new Date(visibleMessages[i - 1].created_at).toDateString()

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-3">
                            <span className="text-xs text-muted-foreground bg-card-hover px-3 py-1 rounded-full">
                              {new Date(msg.created_at).toLocaleDateString('es-AR', {
                                weekday: 'long', day: 'numeric', month: 'long',
                              })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isUser
                              ? 'bg-accent text-accent-foreground rounded-br-sm'
                              : 'bg-card text-foreground rounded-bl-sm shadow-sm border border-border'
                          }`}>
                            <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                            <p className={`text-xs mt-1 text-right ${isUser ? 'text-accent-foreground/70' : 'text-subtle-foreground'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Info panel */}
              {infoOpen && (
                <div className="w-64 shrink-0 border-l border-border bg-card flex flex-col p-5 gap-4 overflow-y-auto">
                  <p className="text-sm font-semibold text-foreground">Info del contacto</p>

                  <div>
                    <p className="text-xs text-subtle-foreground mb-1">Teléfono</p>
                    <p className="text-sm text-foreground">{selectedConv?.customer_phone}</p>
                  </div>

                  {selectedConv?.customer_name && (
                    <div>
                      <p className="text-xs text-subtle-foreground mb-1">Nombre</p>
                      <p className="text-sm text-foreground">{selectedConv.customer_name}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-subtle-foreground mb-1">Estado</p>
                    {selectedConv && <StatusBadge status={selectedConv.status} />}
                  </div>

                  <div>
                    <p className="text-xs text-subtle-foreground mb-1">Inicio de conversación</p>
                    <p className="text-sm text-foreground">
                      {selectedConv?.created_at
                        ? new Date(selectedConv.created_at).toLocaleDateString('es-AR', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-subtle-foreground">Nota interna</p>
                    <p className="text-xs text-subtle-foreground/70">Solo visible en el dashboard</p>
                    <textarea
                      value={noteValue}
                      onChange={e => setNoteValue(e.target.value)}
                      onBlur={handleSaveNote}
                      rows={5}
                      placeholder="Agregar una nota sobre este cliente..."
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-accent resize-none transition-colors duration-200"
                    />
                    {savingNote && <p className="text-xs text-subtle-foreground">Guardando...</p>}
                  </div>
                </div>
              )}

            </div>

            {/* Agent reply bar — solo cuando está en human_takeover */}
            {selectedConv?.status === 'human_takeover' && (
              <div className="border-t border-warning/20 bg-warning-subtle px-4 py-3 flex gap-2 items-end shrink-0">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-xs font-medium text-warning px-0.5">Respondiendo como agente</span>
                  <textarea
                    value={agentInput}
                    onChange={e => setAgentInput(e.target.value)}
                    onKeyDown={handleAgentKeyDown}
                    placeholder="Escribí tu respuesta al cliente... (Enter para enviar)"
                    rows={2}
                    className="w-full border border-warning/30 bg-card rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-warning resize-none transition-colors duration-200"
                  />
                </div>
                <button
                  onClick={handleSendAgentMessage}
                  disabled={!agentInput.trim() || sendingAgent}
                  className="bg-warning text-white p-2.5 rounded-lg hover:opacity-90 transition-[opacity,transform] duration-200 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 shrink-0"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            )}

          </>
        )}
      </div>

    </div>
  )
}
