export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <span className="text-sm font-medium text-gray-700">Configuración</span>
      </div>
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          {/* Cuenta */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Mi cuenta</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Nombre</label>
                <input type="text" placeholder="Tu nombre" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#10B981]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Email</label>
                <input type="email" placeholder="tu@email.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#10B981]" />
              </div>
            </div>
          </div>

          {/* Plan */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Plan actual</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Plan gratuito</div>
                <div className="text-xs text-gray-400 mt-0.5">150 mensajes por mes · 1 agente</div>
              </div>
              <button className="px-4 py-2 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669] transition-colors">
                Mejorar plan
              </button>
            </div>
          </div>

          {/* Peligro */}
          <div className="bg-white rounded-xl border border-red-100 p-6">
            <h2 className="text-sm font-semibold text-red-600 mb-4">Zona de peligro</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Cerrar sesión</div>
                <div className="text-xs text-gray-400 mt-0.5">Salir de tu cuenta en este dispositivo</div>
              </div>
              <button className="px-4 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200">
                Cerrar sesión
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}