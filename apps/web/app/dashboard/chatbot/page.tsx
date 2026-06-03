'use client'

import { useEffect, useState } from 'react'
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

export default function ChatbotPage() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/chatbot-config')
      .then(res => res.json())
      .then(data => {
        setConfig(data.config)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

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

      {/* CONTENIDO */}
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-sm text-gray-400">Cargando configuración...</span>
          </div>
        ) : (
          <form action={handleSubmit}>
            <div className="max-w-2xl mx-auto flex flex-col gap-6">

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
        )}
      </div>
    </div>
  )
}