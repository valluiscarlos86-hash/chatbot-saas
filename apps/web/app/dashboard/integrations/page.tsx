export default function IntegrationsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <span className="text-sm font-medium text-gray-700">Integraciones</span>
      </div>
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">

          {/* WhatsApp */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl min-w-12">
              📱
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">WhatsApp Business</div>
              <div className="text-xs text-gray-400 mt-0.5">Conectá tu número de WhatsApp para recibir y responder mensajes</div>
            </div>
            <button className="px-4 py-2 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669] transition-colors">
              Conectar
            </button>
          </div>

          {/* Widget web */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl min-w-12">
              🌐
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">Widget para tu web</div>
              <div className="text-xs text-gray-400 mt-0.5">Agregá un chat en tu sitio web con un pequeño script</div>
            </div>
            <button className="px-4 py-2 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669] transition-colors">
              Configurar
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}