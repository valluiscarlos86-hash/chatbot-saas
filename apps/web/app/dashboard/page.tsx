export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Inicio</span>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
            5 días de prueba
          </span>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-6 bg-gray-50 flex flex-col gap-6">

        {/* Bienvenida */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Buen día, <span className="text-[#10B981]">Valentino</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Aquí está el resumen de tu cuenta
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
              <span className="text-emerald-600 text-sm">✉</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">Mensajes este mes</div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-400 mt-1">límite: 150 mensajes</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
              <span className="text-blue-600 text-sm">💬</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">Conversaciones activas</div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-400 mt-1">bot respondiendo</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
              <span className="text-purple-600 text-sm">📄</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">Documentos</div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-400 mt-1">en knowledge base</div>
          </div>
        </div>

        {/* Conversaciones recientes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900">Conversaciones recientes</span>
            <span className="text-sm text-[#10B981] cursor-pointer hover:underline">Ver todas</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 cursor-pointer hover:border-[#10B981] transition-colors">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700 min-w-9">MG</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">María González</div>
                <div className="text-xs text-gray-500">¿Tienen el vestido rojo en talle M?</div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-xs text-gray-400">hace 2 min</span>
                <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}