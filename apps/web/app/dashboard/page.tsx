import Link from 'next/link'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

interface RecentConversation {
  id: string
  customer_name: string | null
  customer_phone: string
  status: 'bot_active' | 'human_takeover' | 'closed'
  updated_at: string
  last_message: string | null
  last_message_role: 'user' | 'assistant' | null
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  return phone.slice(-2)
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `hace ${diffMins} min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `hace ${diffHours}h`
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

const STATUS_DOT: Record<string, string> = {
  bot_active: 'bg-[#10B981]',
  human_takeover: 'bg-amber-400',
  closed: 'bg-gray-300',
}

export default async function DashboardPage() {
  const { userId } = await auth()

  // Defaults for unauthenticated or missing org
  const user = await currentUser()
  const firstName = user?.firstName ?? null

  let messageLimit = 150
  let trialDaysLeft: number | null = null
  let messagesThisMonth = 0
  let activeConversations = 0
  let readyDocuments = 0
  let recentConversations: RecentConversation[] = []

  if (userId) {
    const orgRows = await db.execute(
      sql`SELECT id, name, is_trial, trial_ends_at, monthly_message_limit
          FROM organizations WHERE clerk_user_id = ${userId} LIMIT 1`
    )
    const org = orgRows[0] as any

    if (org) {
      messageLimit = org.monthly_message_limit ?? 150

      if (org.is_trial && org.trial_ends_at) {
        trialDaysLeft = Math.max(
          0,
          Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86_400_000),
        )
      }

      const orgId = org.id as string

      const [msgRows, convRows, docRows, recentRows] = await Promise.all([
        db.execute(sql`
          SELECT COUNT(*)::int AS count FROM messages
          WHERE org_id = ${orgId}
            AND created_at >= DATE_TRUNC('month', NOW())
        `),
        db.execute(sql`
          SELECT COUNT(*)::int AS count FROM conversations
          WHERE org_id = ${orgId} AND status = 'bot_active'
        `),
        db.execute(sql`
          SELECT COUNT(*)::int AS count FROM knowledge_documents
          WHERE org_id = ${orgId} AND status = 'ready'
        `),
        db.execute(sql`
          SELECT
            c.id,
            c.customer_name,
            c.customer_phone,
            c.status,
            c.updated_at,
            m.content  AS last_message,
            m.role     AS last_message_role
          FROM conversations c
          LEFT JOIN LATERAL (
            SELECT content, role FROM messages
            WHERE conversation_id = c.id AND role != 'system'
            ORDER BY created_at DESC LIMIT 1
          ) m ON true
          WHERE c.org_id = ${orgId}
          ORDER BY c.updated_at DESC
          LIMIT 5
        `),
      ])

      messagesThisMonth = (msgRows[0] as any)?.count ?? 0
      activeConversations = (convRows[0] as any)?.count ?? 0
      readyDocuments = (docRows[0] as any)?.count ?? 0
      recentConversations = recentRows as unknown as RecentConversation[]
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Inicio</span>
        {trialDaysLeft !== null && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
            {trialDaysLeft === 0 ? 'Trial vencido' : `${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''} de prueba`}
          </span>
        )}
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-6 bg-gray-50 flex flex-col gap-6 overflow-auto">

        {/* Bienvenida */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Buen día{firstName ? <>, <span className="text-[#10B981]">{firstName}</span></> : null}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Aquí está el resumen de tu cuenta</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
              <span className="text-emerald-600 text-sm">✉</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">Mensajes este mes</div>
            <div className="text-2xl font-bold text-gray-900">{messagesThisMonth}</div>
            <div className="text-xs text-gray-400 mt-1">límite: {messageLimit} mensajes</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
              <span className="text-blue-600 text-sm">💬</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">Conversaciones activas</div>
            <div className="text-2xl font-bold text-gray-900">{activeConversations}</div>
            <div className="text-xs text-gray-400 mt-1">bot respondiendo</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
              <span className="text-purple-600 text-sm">📄</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">Documentos</div>
            <div className="text-2xl font-bold text-gray-900">{readyDocuments}</div>
            <div className="text-xs text-gray-400 mt-1">en knowledge base</div>
          </div>
        </div>

        {/* Conversaciones recientes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900">Conversaciones recientes</span>
            <Link
              href="/dashboard/conversations"
              className="text-sm text-[#10B981] hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {recentConversations.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">💬</span>
              <p className="text-sm text-gray-500 font-medium">Todavía no hay conversaciones</p>
              <p className="text-xs text-gray-400">Conectá WhatsApp para empezar a recibir mensajes</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentConversations.map(conv => {
                const initials = getInitials(conv.customer_name, conv.customer_phone)
                const displayName = conv.customer_name || conv.customer_phone
                const preview = conv.last_message
                  ? (conv.last_message_role === 'assistant' ? `Bot: ${conv.last_message}` : conv.last_message)
                  : 'Sin mensajes'

                return (
                  <Link
                    key={conv.id}
                    href="/dashboard/conversations"
                    className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 hover:border-[#10B981] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#10B981] flex items-center justify-center text-xs font-semibold text-white min-w-9">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{displayName}</div>
                      <div className="text-xs text-gray-500 truncate">{preview}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs text-gray-400">{formatRelativeTime(conv.updated_at)}</span>
                      <div className={`w-2 h-2 rounded-full ${STATUS_DOT[conv.status] ?? 'bg-gray-300'}`} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
