import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { saveChatbotConfig } from './actions'

async function getChatbotConfig(userId: string) {
  const org = await db.execute(
    sql`SELECT id FROM organizations WHERE clerk_user_id = ${userId} LIMIT 1`
  )
  if (!org[0]) return null

  const config = await db.execute(
    sql`SELECT * FROM chatbot_configs WHERE org_id = ${org[0].id as string} LIMIT 1`
  )
  return config[0] ?? null
}

export default async function ChatbotPage() {
  const { userId } = await auth()
  const config = await getChatbotConfig(userId!)

  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <span className="text-sm font-medium text-gray-700">Configuración del chatbot</span>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        <form action={saveChatbotConfig}>
          <div className="max-w-2xl mx-auto flex flex-col gap-6">

            {/* Mi empresa */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Mi empresa</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Nombre del negocio</label>
                  <input name="businessName" type="text" defaultValue={String(config?.business_name ?? '')} placeholder="Ej: Tienda Ropa Córdoba" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Descripción del negocio</label>
                  <textarea name="businessDescription" rows={3} defaultValue={String(config?.business_description ?? '')} placeholder="Describí tu negocio" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981] resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Datos de contacto</label>
                  <input name="contactInfo" type="text" defaultValue={String(config?.contact_info ?? '')} placeholder="Ej: Tel: 351-1234567" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
                </div>
              </div>
            </div>

            {/* Mi bot */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Mi bot</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Nombre del bot</label>
                  <input name="botName" type="text" defaultValue={String(config?.bot_name ?? '')} placeholder="Ej: Asistente de TiendaRopa" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Tono de respuesta</label>
                  <select name="botTone" defaultValue={String(config?.bot_tone ?? 'friendly')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]">
                    <option value="friendly">Amigable</option>
                    <option value="formal">Formal</option>
                    <option value="neutral">Neutro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Mensaje de bienvenida</label>
                  <textarea name="welcomeMessage" rows={2} defaultValue={String(config?.welcome_message ?? '')} placeholder="Ej: ¡Hola! Soy el asistente de TiendaRopa." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981] resize-none" />
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Instrucciones al bot</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Reglas de escalada</label>
                  <textarea name="escalationRules" rows={3} defaultValue={String(config?.escalation_rules ?? '')} placeholder="Ej: Si el cliente pide hablar con una persona, derivar inmediatamente." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981] resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Horario de atención</label>
                  <input name="officeHours" type="text" defaultValue={String(config?.office_hours ?? '')} placeholder="Ej: Lunes a viernes de 9 a 18hs" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
                </div>
              </div>
            </div>

            {/* Botón guardar */}
            <button type="submit" className="w-full bg-[#10B981] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors">
              Guardar configuración
            </button>

          </div>
        </form>
      </div>
    </div>
  )
}