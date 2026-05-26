export default function ChatbotPage() {
  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Configuración del chatbot</span>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          {/* Mi empresa */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Mi empresa</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Nombre del negocio</label>
                <input type="text" placeholder="Ej: Tienda Ropa Córdoba" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Descripción del negocio</label>
                <textarea rows={3} placeholder="Describí tu negocio — el bot usa esto para responder preguntas generales sobre tu empresa" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981] resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Datos de contacto</label>
                <input type="text" placeholder="Ej: Tel: 351-1234567 | Email: info@tienda.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
              </div>
            </div>
          </div>

          {/* Mi bot */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Mi bot</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Nombre del bot</label>
                <input type="text" placeholder="Ej: Asistente de TiendaRopa" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Tono de respuesta</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]">
                  <option value="friendly">Amigable</option>
                  <option value="formal">Formal</option>
                  <option value="neutral">Neutro</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Mensaje de bienvenida</label>
                <textarea rows={2} placeholder="Ej: ¡Hola! Soy el asistente de TiendaRopa. ¿En qué puedo ayudarte hoy?" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981] resize-none" />
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Instrucciones al bot</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Reglas de escalada</label>
                <textarea rows={3} placeholder="Ej: Si el cliente pregunta por devoluciones o reclamos, derivar a un humano. Si el cliente pide hablar con una persona, derivar inmediatamente." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981] resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Horario de atención</label>
                <input type="text" placeholder="Ej: Lunes a viernes de 9 a 18hs" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]" />
              </div>
            </div>
          </div>

          {/* Botón guardar */}
          <button className="w-full bg-[#10B981] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors">
            Guardar configuración
          </button>

        </div>
      </div>
    </div>
  )
}