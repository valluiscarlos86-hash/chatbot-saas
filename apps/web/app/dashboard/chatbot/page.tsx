'use client'

import { useEffect, useRef, useState } from 'react'
import { saveChatbotConfig } from './actions'

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

interface ChatMessage {
  role: 'user' | 'bot'
  content: string
}

export default function ChatbotPage() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/chatbot-config')
      .then(res => res.json())
      .then(data => {
        setConfig(data.config)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    await saveChatbotConfig(formData)
    setSaving(false)
    setSaved(true)
    setConfig(prev => ({
      ...prev,
      business_name: formData.get('businessName') as string,
    }))
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
        { role: 'bot', content: data.response || data.error || 'Sin respuesta' },
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const hasConfig = config !== null

  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <span className="text-sm font-medium text-gray-700">Configuración del chatbot</span>
      </div>

      {/* CARTEL DE ÉXITO */}
      {saved && (
        <div className="mx-6 mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="text-emerald-600 text-sm">✓</span>
          <span className="text-sm text-emerald-700 font-medium">Configuración guardada correctamente</span>
        </div>
      )}

      {/* CONTENIDO — dos columnas */}
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-sm text-gray-400">Cargando configuración...</span>
          </div>
        ) : (
          <div className="flex gap-6 h-full items-start">

            {/* COLUMNA IZQUIERDA — formulario de config */}
            <div className="flex-1 min-w-0">
              <form action={handleSubmit}>
                <div className="flex flex-col gap-6">

                  {/* Mi empresa */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Mi empresa</h2>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Nombre del negocio</label>
                        <input name="businessName" type="text" defaultValue={config?.business_name ?? ''} placeholder="Ej: Tienda Ropa Córdoba" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Descripción del negocio</label>
                        <textarea name="businessDescription" rows={3} defaultValue={config?.business_description ?? ''} placeholder="Describí tu negocio" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981] resize-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Datos de contacto</label>
                        <input name="contactInfo" type="text" defaultValue={config?.contact_info ?? ''} placeholder="Ej: Tel: 351-1234567" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
                      </div>
                    </div>
                  </div>

                  {/* Mi bot */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Mi bot</h2>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Nombre del bot</label>
                        <input name="botName" type="text" defaultValue={config?.bot_name ?? ''} placeholder="Ej: Asistente de TiendaRopa" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Tono de respuesta</label>
                        <select name="botTone" defaultValue={config?.bot_tone ?? 'friendly'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]">
                          <option value="friendly">Amigable</option>
                          <option value="formal">Formal</option>
                          <option value="neutral">Neutro</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Mensaje de bienvenida</label>
                        <textarea name="welcomeMessage" rows={2} defaultValue={config?.welcome_message ?? ''} placeholder="Ej: ¡Hola! Soy el asistente de TiendaRopa." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981] resize-none" />
                      </div>
                    </div>
                  </div>

                  {/* Instrucciones */}
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4">Instrucciones al bot</h2>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Reglas de escalada</label>
                        <textarea name="escalationRules" rows={3} defaultValue={config?.escalation_rules ?? ''} placeholder="Ej: Si el cliente pide hablar con una persona, derivar inmediatamente." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981] resize-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1.5">Horario de atención</label>
                        <input name="officeHours" type="text" defaultValue={config?.office_hours ?? ''} placeholder="Ej: Lunes a viernes de 9 a 18hs" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
                      </div>
                    </div>
                  </div>

                  {/* Botón */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#10B981] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Guardando...' : hasConfig ? 'Actualizar configuración' : 'Guardar configuración'}
                  </button>

                </div>
              </form>
            </div>

            {/* COLUMNA DERECHA — chat de prueba */}
            <div className="w-80 shrink-0 sticky top-0">
              <div className="bg-white rounded-xl border border-gray-100 flex flex-col" style={{ height: '600px' }}>

                {/* Header del chat */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Probar bot</p>
                  <p className="text-xs text-gray-400 mt-0.5">Probá cómo responde tu bot con la configuración actual</p>
                </div>

                {/* Mensajes */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {chatMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-gray-400 text-center">Escribí un mensaje para probar el bot</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#10B981] text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-3 py-2 rounded-xl rounded-bl-sm">
                        <span className="flex gap-1 items-center h-4">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-100 flex gap-2 items-end">
                  <textarea
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribí un mensaje..."
                    rows={1}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981] resize-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className="bg-[#10B981] text-white p-2 rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-40 shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M3.105 2.288a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.897 28.897 0 0015.293-7.155.75.75 0 000-1.114A28.897 28.897 0 003.105 2.288z" />
                    </svg>
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
