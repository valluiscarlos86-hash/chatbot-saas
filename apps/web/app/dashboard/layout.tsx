'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Inicio' },
    { href: '/dashboard/conversations', label: 'Conversaciones' },
    { href: '/dashboard/chatbot', label: 'Chatbot' },
    { href: '/dashboard/documents', label: 'Documentos' },
    { href: '/dashboard/analytics', label: 'Analítica' },
    { href: '/dashboard/integrations', label: 'Integraciones' },
  ]

  return (
    <div className="flex h-screen bg-white">
      <aside className="w-56 min-w-56 bg-[#111827] flex flex-col">
        <div className="px-4 py-5 text-white font-bold text-lg">
          Atent<span className="text-[#10B981]">IA</span>
        </div>
        <nav className="flex-1 px-2 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#10B981] text-white font-medium'
                    : 'text-gray-400 hover:bg-[#1F2937] hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-[#1F2937]">
          <Link
            href="/dashboard/settings"
            className={`px-3 py-2 rounded-lg text-sm block mb-2 transition-colors ${
              pathname === '/dashboard/settings'
                ? 'bg-[#10B981] text-white font-medium'
                : 'text-gray-400 hover:bg-[#1F2937] hover:text-white'
            }`}
          >
            Configuración
          </Link>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#1F2937] cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-full bg-[#10B981] flex items-center justify-center text-xs font-semibold text-white min-w-7">
              VB
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-white font-medium">Valentino B.</span>
              <span className="text-xs text-gray-500">Plan gratuito</span>
            </div>
            <UserButton />
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}