import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { fechaUTC } from '@/lib/fechas'
import { sql } from 'drizzle-orm'

async function getOrganization(clerkUserId: string) {
  const result = await db.execute(
    sql`SELECT name, email, plan, is_trial, trial_ends_at, monthly_message_count, monthly_message_limit 
        FROM organizations 
        WHERE clerk_user_id = ${clerkUserId} 
        LIMIT 1`
  )
  return result[0] ?? null
}

function getDaysRemaining(trialEndsAt: string): number {
  const now = new Date()
  const end = fechaUTC(trialEndsAt)
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()
  const org = await getOrganization(userId!)

  const firstName = user?.firstName ?? String(org?.name ?? 'Usuario')
  const daysRemaining = org?.trial_ends_at ? getDaysRemaining(String(org.trial_ends_at)) : 0

  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Inicio</span>
        <div className="flex items-center gap-3">
   {Boolean(org?.is_trial) && (
  <span className="text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
    {daysRemaining > 0 ? `${daysRemaining} días de prueba` : 'Prueba vencida'}
  </span>
)}
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-6 bg-gray-50 flex flex-col gap-6">

        {/* Bienvenida */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Buen día, <span className="text-[#10B981]">{firstName}</span>
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
            <div className="text-2xl font-bold text-gray-900">
              {Number(org?.monthly_message_count ?? 0)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              límite: {Number(org?.monthly_message_limit ?? 150)} mensajes
            </div>
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
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-400">Todavía no hay conversaciones</p>
            <p className="text-xs text-gray-300 mt-1">Conectá WhatsApp para empezar</p>
          </div>
        </div>

      </div>
    </div>
  )
}