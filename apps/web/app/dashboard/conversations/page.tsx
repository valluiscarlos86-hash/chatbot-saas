export default function ConversationsPage() {
  return (
    <div className="flex h-full">

      {/* PANEL IZQUIERDO — lista */}
      <div className="w-72 min-w-72 border-r border-gray-100 bg-white flex flex-col">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-700">Conversaciones</span>
        </div>

        {/* Buscador */}
        <div className="px-3 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#10B981]"
          />
        </div>

        {/* Filtros */}
        <div className="px-3 py-2 border-b border-gray-100 flex gap-2">
          <button className="px-3 py-1 rounded-full text-xs bg-[#10B981] text-white font-medium">Todas</button>
          <button className="px-3 py-1 rounded-full text-xs text-gray-500 hover:bg-gray-100">Activas</button>
          <button className="px-3 py-1 rounded-full text-xs text-gray-500 hover:bg-gray-100">Humano</button>
          <button className="px-3 py-1 rounded-full text-xs text-gray-500 hover:bg-gray-100">Cerradas</button>
        </div>

        {/* Lista vacía */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6">
          <span className="text-2xl">💬</span>
          <p className="text-sm text-gray-400 text-center">No hay conversaciones todavía</p>
          <p className="text-xs text-gray-300 text-center">Conectá WhatsApp para empezar a recibir mensajes</p>
        </div>

      </div>

      {/* PANEL DERECHO — hilo de mensajes */}
      <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center gap-3">
        <span className="text-4xl">👈</span>
        <p className="text-sm text-gray-400">Seleccioná una conversación para verla</p>
      </div>

    </div>
  )
}