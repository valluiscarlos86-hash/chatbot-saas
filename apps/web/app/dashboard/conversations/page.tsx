'use client'

import { useEffect, useRef, useState } from 'react'

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

const STATUS_STYLE: Record<Conversation['status'], { label: string; cls: string }> = {
  bot_active: { label: 'Bot activo', cls: 'bg-emerald-50 text-emerald-600' },
  human_takeover: { label: 'Agente', cls: 'bg-amber-50 text-amber-600' },
  closed: { label: 'Cerrada', cls: 'bg-gray-100 text-gray-500' },
}

function StatusBadge({ status }: { status: Conversation['status'] }) {
  const { label, cls } = STATUS_STYLE[status]
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${cls}`}>
      {label}
    </span>
  )
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const diffHours = (Date.now() - date.getTime()) / 3_600_000
  if (diffHours < 24) return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function SendIcon({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M3.105 2.288a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.897 28.897 0 0015.293-7.155.75.75 0 000-1.114A28.897 28.897 0 003.105 2.288z" />
    </svg>
  )
}

function SparklesIcon({ className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
    </svg>
  )
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
      <div className="w-72 min-w-72 border-r border-gray-100 bg-white flex flex-col">

        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Conversaciones</span>
          {conversations.length > 0 && <span className="text-xs text-gray-400">{conversations.length}</span>}
        </div>

        <div className="px-3 py-3 border-b border-gray-100">
          <input
            type="text"
            value={convSearch}
            onChange={e => setConvSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#10B981]"
          />
        </div>

        <div className="px-3 py-2 border-b border-gray-100 flex gap-1.5 flex-wrap">
          {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f ? 'bg-[#10B981] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <span className="text-xs text-gray-400">Cargando...</span>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 h-32">
              <span className="text-2xl">💬</span>
              <p className="text-xs text-gray-400 text-center">
                {conversations.length === 0 ? 'No hay conversaciones todavía' : 'Sin resultados para este filtro'}
              </p>
              {conversations.length === 0 && (
                <p className="text-xs text-gray-300 text-center">Conectá WhatsApp para empezar</p>
              )}
            </div>
          ) : (
            filteredConvs.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors border-l-2 ${
                  selectedId === conv.id ? 'bg-emerald-50 border-l-[#10B981]' : 'border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.customer_name || conv.customer_phone}
                    </p>
                    {conv.customer_name && (
                      <p className="text-xs text-gray-400 truncate">{conv.customer_phone}</p>
                    )}
                    {conv.last_message && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {conv.last_message_role === 'assistant' && <span className="text-gray-400">Bot: </span>}
                        {conv.last_message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs text-gray-400">{formatTime(conv.updated_at)}</span>
                    <StatusBadge status={conv.status} />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

      </div>

      {/* PANEL DERECHO */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">👈</span>
            <p className="text-sm text-gray-400">Seleccioná una conversación para verla</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedConv?.customer_name || selectedConv?.customer_phone}
                </p>
                {selectedConv?.customer_name && (
                  <p className="text-xs text-gray-400">{selectedConv.customer_phone}</p>
                )}
              </div>
              {selectedConv && <StatusBadge status={selectedConv.status} />}
            </div>

            {/* Action bar */}
            <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2 shrink-0">
              {/* Status actions */}
              {selectedConv?.status === 'bot_active' && (
                <button
                  onClick={() => handleStatusChange('human_takeover')}
                  disabled={changingStatus}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Tomar control
                </button>
              )}
              {(selectedConv?.status === 'human_takeover' || selectedConv?.status === 'closed') && (
                <button
                  onClick={() => handleStatusChange('bot_active')}
                  disabled={changingStatus}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Reactivar bot
                </button>
              )}
              {selectedConv?.status !== 'closed' && (
                <button
                  onClick={() => handleStatusChange('closed')}
                  disabled={changingStatus}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50 whitespace-nowrap"
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
                  className="border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#10B981] w-44"
                />
                <svg className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Resumen IA */}
              <button
                onClick={handleGenerateSummary}
                disabled={summaryLoading}
                title="Resumen con IA"
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                  summary !== null ? 'bg-violet-500 text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <SparklesIcon className={`w-4 h-4 ${summaryLoading ? 'animate-pulse' : ''}`} />
              </button>

              {/* Info toggle */}
              <button
                onClick={() => setInfoOpen(o => !o)}
                title="Info del contacto"
                className={`p-1.5 rounded-lg transition-colors ${
                  infoOpen ? 'bg-[#10B981] text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Cuadro de resumen IA */}
            {summary !== null && (
              <div className="mx-5 mt-3 shrink-0 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <SparklesIcon className={`w-4 h-4 text-violet-500 shrink-0 mt-0.5 ${summaryLoading ? 'animate-pulse' : ''}`} />
                    <p className="text-sm text-violet-900 leading-relaxed">
                      {summaryLoading ? 'Generando resumen...' : summary}
                    </p>
                  </div>
                  {!summaryLoading && (
                    <button
                      onClick={() => setSummary(null)}
                      className="text-violet-300 hover:text-violet-500 transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
                    <span className="text-sm text-gray-400">Cargando mensajes...</span>
                  </div>
                ) : visibleMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <span className="text-sm text-gray-400">
                      {messageSearch ? 'Sin resultados para esa búsqueda' : 'No hay mensajes en esta conversación'}
                    </span>
                  </div>
                ) : (
                  visibleMessages.map((msg, i) => {
                    if (msg.role === 'system') {
                      return (
                        <div key={msg.id} className="flex justify-center my-1">
                          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
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
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                              {new Date(msg.created_at).toLocaleDateString('es-AR', {
                                weekday: 'long', day: 'numeric', month: 'long',
                              })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isUser
                              ? 'bg-[#10B981] text-white rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                          }`}>
                            <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                            <p className={`text-xs mt-1 text-right ${isUser ? 'text-emerald-100' : 'text-gray-400'}`}>
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
                <div className="w-64 shrink-0 border-l border-gray-100 bg-white flex flex-col p-5 gap-4 overflow-y-auto">
                  <p className="text-sm font-semibold text-gray-900">Info del contacto</p>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Teléfono</p>
                    <p className="text-sm text-gray-900">{selectedConv?.customer_phone}</p>
                  </div>

                  {selectedConv?.customer_name && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Nombre</p>
                      <p className="text-sm text-gray-900">{selectedConv.customer_name}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Estado</p>
                    {selectedConv && <StatusBadge status={selectedConv.status} />}
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Inicio de conversación</p>
                    <p className="text-sm text-gray-900">
                      {selectedConv?.created_at
                        ? new Date(selectedConv.created_at).toLocaleDateString('es-AR', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-gray-400">Nota interna</p>
                    <p className="text-xs text-gray-300">Solo visible en el dashboard</p>
                    <textarea
                      value={noteValue}
                      onChange={e => setNoteValue(e.target.value)}
                      onBlur={handleSaveNote}
                      rows={5}
                      placeholder="Agregar una nota sobre este cliente..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#10B981] resize-none"
                    />
                    {savingNote && <p className="text-xs text-gray-400">Guardando...</p>}
                  </div>
                </div>
              )}

            </div>

            {/* Agent reply bar — solo cuando está en human_takeover */}
            {selectedConv?.status === 'human_takeover' && (
              <div className="border-t border-amber-100 bg-amber-50/60 px-4 py-3 flex gap-2 items-end shrink-0">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-xs font-medium text-amber-600 px-0.5">Respondiendo como agente</span>
                  <textarea
                    value={agentInput}
                    onChange={e => setAgentInput(e.target.value)}
                    onKeyDown={handleAgentKeyDown}
                    placeholder="Escribí tu respuesta al cliente... (Enter para enviar)"
                    rows={2}
                    className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
                <button
                  onClick={handleSendAgentMessage}
                  disabled={!agentInput.trim() || sendingAgent}
                  className="bg-amber-500 text-white p-2.5 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-40 shrink-0"
                >
                  <SendIcon />
                </button>
              </div>
            )}

          </>
        )}
      </div>

    </div>
  )
}
