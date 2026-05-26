export default function DocumentsPage() {
  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <span className="text-sm font-medium text-gray-700">Documentos</span>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          {/* Upload zone */}
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#10B981] transition-colors">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl">
              📄
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Subir documento</p>
              <p className="text-xs text-gray-400 mt-1">PDF, Word o TXT — máximo 10MB</p>
            </div>
            <button className="mt-2 px-4 py-2 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669] transition-colors">
              Elegir archivo
            </button>
          </div>

          {/* Lista de documentos */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Documentos subidos</h2>
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-2xl">📭</span>
              <p className="text-sm text-gray-400">Todavía no subiste ningún documento</p>
              <p className="text-xs text-gray-300">Los documentos que subas aparecerán acá</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}