import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-white">

      {/* SIDEBAR */}
      <aside className="w-52 min-w-52 bg-[#111827] flex flex-col">

        {/* Logo */}
        <div className="px-4 py-5 text-white font-bold text-lg tracking-tight">
          Atent<span className="text-[#10B981]">IA</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 flex flex-col gap-0.5">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-[#10B981] text-white font-medium">
            Inicio
          </Link>
          <Link href="/dashboard/conversations" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#1F2937] hover:text-white transition-colors">
            Conversaciones
          </Link>
          <Link href="/dashboard/chatbot" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#1F2937] hover:text-white transition-colors">
            Chatbot
          </Link>
          <Link href="/dashboard/documents" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#1F2937] hover:text-white transition-colors">
            Documentos
          </Link>
          <Link href="/dashboard/analytics" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#1F2937] hover:text-white transition-colors">
            Analítica
          </Link>
          <Link href="/dashboard/integrations" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#1F2937] hover:text-white transition-colors">
            Integraciones
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#1F2937]">
          <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#1F2937] hover:text-white transition-colors mb-2">
            Configuración
          </Link>
          <div className="flex items-center gap-2.5 px-2 py-2">
          <UserButton />
            <div className="flex flex-col">
              <span className="text-xs text-white font-medium">Mi cuenta</span>
              <span className="text-xs text-gray-500">Plan gratuito</span>
            </div>
          </div>
        </div>

      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

    </div>
  )
}