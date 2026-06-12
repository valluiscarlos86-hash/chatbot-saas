'use client'

import { useEffect, useRef, useState } from 'react'

interface Conversation {
  id: string
  customer_phone: string
  customer_name: string | null
  status: 'bot_active' | 'human_takeover' | 'closed'
  updated_at: string
  last_message: string | null
  last_message_role: 'user' | 'assistant' | null
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

type Filter = 'all' | 'bot_active' | 'human_takeover' | 'closed'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Todas',
  bot_active: 'Activas',
  human_takeover: 'Humano',
  closed: 'Cerradas',
}

const STATUS_STYLE: Record<Conversation['status'], { label: string; cls: string }> = {
  bot_active: { label: 'Bot', cls: 'bg-emerald-50 text-emerald-600' },
  human_takeover: { label: 'Humano', cls: 'bg-amber-50 text-amber-600' },
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
  if (diffHours < 24) {
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => {
        setConversations(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setMessagesLoading(true)
    setMessages([])
    fetch(`/api/conversations/${selectedId}/messages`)
      .then(r => r.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data : [])
        setMessagesLoading(false)
      })
      .catch(() => setMessagesLoading(false))
  }, [selectedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filtered = conversations.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.customer_phone.includes(q) ||
        (c.customer_name?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  const selectedConv = conversations.find(c => c.id === selectedId)

  return (
    <div className="flex h-full">

      {/* PANEL IZQUIERDO — lista */}
      <div className="w-72 min-w-72 border-r border-gray-100 bg-white flex flex-col">

        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Conversaciones</span>
          {conversations.length > 0 && (
            <span className="text-xs text-gray-400">{conversations.length}</span>
          )}
        </div>

        <div className="px-3 py-3 border-b border-gray-100">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
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
                filter === f
                  ? 'bg-[#10B981] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 h-32">
              <span className="text-2xl">💬</span>
              <p className="text-xs text-gray-400 text-center">
                {conversations.length === 0
                  ? 'No hay conversaciones todavía'
                  : 'Sin resultados para este filtro'}
              </p>
              {conversations.length === 0 && (
                <p className="text-xs text-gray-300 text-center">
                  Conectá WhatsApp para empezar a recibir mensajes
                </p>
              )}
            </div>
          ) : (
            filtered.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  selectedId === conv.id
                    ? 'bg-emerald-50 border-l-2 border-l-[#10B981]'
                    : 'border-l-2 border-l-transparent'
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
                        {conv.last_message_role === 'assistant' && (
                          <span className="text-gray-400">Bot: </span>
                        )}
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

      {/* PANEL DERECHO — hilo de mensajes */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">👈</span>
            <p className="text-sm text-gray-400">Seleccioná una conversación para verla</p>
          </div>
        ) : (
          <>
            {/* Header del hilo */}
            <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shrink-0">
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

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <span className="text-sm text-gray-400">Cargando mensajes...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <span className="text-sm text-gray-400">No hay mensajes en esta conversación</span>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isUser = msg.role === 'user'
                  const showDate =
                    i === 0 ||
                    new Date(msg.created_at).toDateString() !==
                      new Date(messages[i - 1].created_at).toDateString()

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-3">
                          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                            {new Date(msg.created_at).toLocaleDateString('es-AR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isUser
                              ? 'bg-[#10B981] text-white rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                          }`}
                        >
                          <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 text-right ${
                              isUser ? 'text-emerald-100' : 'text-gray-400'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>

    </div>
  )
}
