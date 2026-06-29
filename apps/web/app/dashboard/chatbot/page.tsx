'use client'

import { useEffect, useRef, useState } from 'react'
import { saveChatbotConfig } from './actions'
import { CheckCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { MagnifyingGlassIcon, DocumentTextIcon, LinkIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ChatbotConfig {
  business_name?: string
  business_description?: string
  contact_info?: string
  bot_name?: string
  bot_tone?: string
  welcome_message?: string
  escalation_rules?: string
  office_hours?: string
}

interface ChatSource {
  documentName: string
  sourceType: 'file' | 'url'
  sourceUrl: string | null
  chunkText: string
  similarity: number
}

interface ChatMessage {
  role: 'user' | 'bot'
  content: string
  sources?: ChatSource[]
}

const inputClasses =
  'w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-accent transition-colors duration-200'

export default function ChatbotPage() {
  const [formState, setFormState] = useState<ChatbotConfig>({})
  const [hasConfig, setHasConfig] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [openSources, setOpenSources] = useState<number | null>(null)
  const [expandedSourceKeys, setExpandedSourceKeys] = useState<Set<string>>(new Set())
  const [fullTextKeys, setFullTextKeys] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/chatbot-config')
      .then(res => res.json())
      .then(data => {
        setFormState(data.config ?? {})
        setHasConfig(!!data.config)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  function updateField<K extends keyof ChatbotConfig>(field: K, value: ChatbotConfig[K]) {
    setFormState(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    await saveChatbotConfig(formData)
    setSaving(false)
    setSaved(true)
    setHasConfig(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSendMessage() {
    const message = chatInput.trim()
    if (!message || chatLoading) return

    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    setChatLoading(true)

    try {
      const res = await fetch('/api/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      setChatMessages(prev => [
        ...prev,
        { role: 'bot', content: data.response || data.error || 'Sin respuesta', sources: data.sources ?? [] },
      ])
    } catch {
      setChatMessages(prev => [
        ...prev,
        { role: 'bot', content: 'Error al conectar con el servidor.' },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  function toggleSource(key: string) {
    setExpandedSourceKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleFullText(key: string) {
    setFullTextKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const PREVIEW_LIMIT = 150
  function truncatePreview(text: string) {
    if (text.length <= PREVIEW_LIMIT) return text
    const cut = text.slice(0, PREVIEW_LIMIT)
    const lastSpace = cut.lastIndexOf(' ')
    return `${cut.slice(0, lastSpace > 0 ? lastSpace : PREVIEW_LIMIT)}...`
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-card border-b border-border px-6 py-3">
        <span className="text-sm font-medium text-foreground">Configuración del chatbot</span>
      </div>

      {/* CARTEL DE ÉXITO */}
      {saved && (
        <div className="mx-6 mt-4 bg-accent-subtle border border-accent/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-accent-on-surface shrink-0" />
          <span className="text-sm text-accent-on-surface font-medium">Configuración guardada correctamente</span>
        </div>
      )}

      {/* CONTENIDO — dos columnas */}
      <div className="flex-1 p-6 bg-background overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-sm text-subtle-foreground">Cargando configuración...</span>
          </div>
        ) : (
          <div className="flex gap-6 h-full items-start">

            {/* COLUMNA IZQUIERDA — formulario de config */}
            <div className="flex-2 min-w-0">
              <form action={handleSubmit}>
                <div className="flex flex-col gap-6">

                  {/* Mi empresa */}
                  <Card>
                    <CardHeader><CardTitle>Mi empresa</CardTitle></CardHeader>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nombre del negocio</label>
                        <input name="businessName" type="text" value={formState.business_name ?? ''} onChange={e => updateField('business_name', e.target.value)} placeholder="Ej: Tienda Ropa Córdoba" className={inputClasses} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Descripción del negocio</label>
                        <textarea name="businessDescription" rows={3} value={formState.business_description ?? ''} onChange={e => updateField('business_description', e.target.value)} placeholder="Describí tu negocio" className={`${inputClasses} resize-none`} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Datos de contacto</label>
                        <input name="contactInfo" type="text" value={formState.contact_info ?? ''} onChange={e => updateField('contact_info', e.target.value)} placeholder="Ej: Tel: 351-1234567" className={inputClasses} />
                      </div>
                    </div>
                  </Card>

                  {/* Mi bot */}
                  <Card>
                    <CardHeader><CardTitle>Mi bot</CardTitle></CardHeader>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nombre del bot</label>
                        <input name="botName" type="text" value={formState.bot_name ?? ''} onChange={e => updateField('bot_name', e.target.value)} placeholder="Ej: Asistente de TiendaRopa" className={inputClasses} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tono de respuesta</label>
                        <select name="botTone" value={formState.bot_tone ?? 'friendly'} onChange={e => updateField('bot_tone', e.target.value)} className={inputClasses}>
                          <option value="friendly">Amigable</option>
                          <option value="formal">Formal</option>
                          <option value="neutral">Neutro</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Mensaje de bienvenida</label>
                        <textarea name="welcomeMessage" rows={2} value={formState.welcome_message ?? ''} onChange={e => updateField('welcome_message', e.target.value)} placeholder="Ej: ¡Hola! Soy el asistente de TiendaRopa." className={`${inputClasses} resize-none`} />
                      </div>
                    </div>
                  </Card>

                  {/* Instrucciones */}
                  <Card>
                    <CardHeader><CardTitle>Instrucciones al bot</CardTitle></CardHeader>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Reglas de escalada</label>
                        <textarea name="escalationRules" rows={3} value={formState.escalation_rules ?? ''} onChange={e => updateField('escalation_rules', e.target.value)} placeholder="Ej: Si el cliente pide hablar con una persona, derivar inmediatamente." className={`${inputClasses} resize-none`} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Horario de atención</label>
                        <input name="officeHours" type="text" value={formState.office_hours ?? ''} onChange={e => updateField('office_hours', e.target.value)} placeholder="Ej: Lunes a viernes de 9 a 18hs" className={inputClasses} />
                      </div>
                    </div>
                  </Card>

                  {/* Botón */}
                  <Button type="submit" disabled={saving} className="w-full">
                    {saving ? 'Guardando...' : hasConfig ? 'Actualizar configuración' : 'Guardar configuración'}
                  </Button>

                </div>
              </form>
            </div>

            {/* COLUMNA DERECHA — chat de prueba */}
            <div className="flex-3 min-w-0 sticky top-0">
              <div className="bg-card border border-border rounded-xl flex flex-col" style={{ height: '680px' }}>

                {/* Header del chat */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">Probar bot</p>
                  <p className="text-xs text-subtle-foreground mt-0.5">Probá cómo responde tu bot con la configuración actual</p>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {chatMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-subtle-foreground text-center">Escribí un mensaje para probar el bot</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => {
                    const hasSources = msg.role === 'bot' && (msg.sources?.length ?? 0) > 0
                    const sourcesOpen = openSources === i

                    return (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-accent text-accent-foreground rounded-br-sm'
                                : 'bg-card-hover text-foreground rounded-bl-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                          {hasSources && (
                            <button
                              type="button"
                              onClick={() => setOpenSources(sourcesOpen ? null : i)}
                              title="Ver fuentes usadas en esta respuesta"
                              className={`p-1 rounded-md transition-colors duration-200 shrink-0 ${
                                sourcesOpen
                                  ? 'text-accent-on-surface bg-accent-subtle'
                                  : 'text-subtle-foreground hover:text-accent-on-surface hover:bg-accent-subtle'
                              }`}
                            >
                              <MagnifyingGlassIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {hasSources && sourcesOpen && (
                          <div className="max-w-[90%] mt-1.5 bg-background border border-border rounded-lg p-2 flex flex-col gap-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide px-1 pt-0.5">
                              Fuentes usadas
                            </span>
                            {msg.sources!.map((source, j) => {
                              const key = `${i}-${j}`
                              const expanded = expandedSourceKeys.has(key)
                              return (
                                <div key={j} className="bg-card border border-border rounded-md overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleSource(key)}
                                    className="w-full flex items-center gap-1.5 p-2 text-left hover:bg-card-hover transition-colors duration-200"
                                  >
                                    <ChevronRightIcon
                                      className={`w-3 h-3 text-subtle-foreground shrink-0 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
                                    />
                                    {source.sourceType === 'url' ? (
                                      <LinkIcon className="w-3 h-3 text-subtle-foreground shrink-0" />
                                    ) : (
                                      <DocumentTextIcon className="w-3 h-3 text-subtle-foreground shrink-0" />
                                    )}
                                    <span className="text-xs font-medium text-foreground truncate">{source.documentName}</span>
                                    <span className="text-[10px] text-subtle-foreground ml-auto shrink-0 tabular-nums">
                                      {Math.round(source.similarity * 100)}%
                                    </span>
                                  </button>
                                  {expanded && (() => {
                                    const showFull = fullTextKeys.has(key) || source.chunkText.length <= PREVIEW_LIMIT
                                    return (
                                      <div className="px-2 pb-2 pl-7">
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                          {showFull ? source.chunkText : truncatePreview(source.chunkText)}
                                        </p>
                                        {source.chunkText.length > PREVIEW_LIMIT && (
                                          <button
                                            type="button"
                                            onClick={() => toggleFullText(key)}
                                            className="text-[11px] text-accent-on-surface hover:underline mt-1"
                                          >
                                            {showFull ? 'Ver menos' : 'Ver más'}
                                          </button>
                                        )}
                                      </div>
                                    )
                                  })()}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-card-hover px-3 py-2 rounded-xl rounded-bl-sm">
                        <span className="flex gap-1 items-center h-4">
                          <span className="w-1.5 h-1.5 bg-subtle-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-subtle-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-subtle-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border flex gap-2 items-end">
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribí un mensaje..."
                    rows={1}
                    className={`flex-1 ${inputClasses} resize-none`}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className="bg-accent text-accent-foreground p-2 rounded-lg hover:bg-accent-hover transition-colors duration-200 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 shrink-0"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
