export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <span className="text-sm font-medium text-gray-700">Analítica</span>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          {/* Métricas principales */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs text-gray-500 mb-1">Resolución del bot</div>
              <div className="text-2xl font-bold text-gray-900">0%</div>
              <div className="text-xs text-gray-400 mt-1">consultas sin humano</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs text-gray-500 mb-1">Tiempo de respuesta</div>
              <div className="text-2xl font-bold text-gray-900">0s</div>
              <div className="text-xs text-gray-400 mt-1">promedio</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs text-gray-500 mb-1">Conversaciones</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-xs text-gray-400 mt-1">este mes</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-xs text-gray-500 mb-1">Mensajes usados</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-xs text-gray-400 mt-1">de 150 disponibles</div>
            </div>
          </div>

          {/* Gráfico placeholder */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Conversaciones por día</h2>
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-gray-400">Los gráficos aparecerán cuando tengas conversaciones</p>
            </div>
          </div>

          {/* Preguntas frecuentes */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Preguntas más frecuentes</h2>
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <span className="text-2xl">📊</span>
              <p className="text-sm text-gray-400">Todavía no hay datos suficientes</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}