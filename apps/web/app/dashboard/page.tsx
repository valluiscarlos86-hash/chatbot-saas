import Link from 'next/link'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

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
  bot_active: 'bg-accent-on-surface',
  human_takeover: 'bg-warning',
  closed: 'bg-subtle-foreground',
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

  const metrics = [
    {
      label: 'Mensajes este mes',
      value: messagesThisMonth,
      hint: `límite: ${messageLimit} mensajes`,
      icon: EnvelopeIcon,
    },
    {
      label: 'Conversaciones activas',
      value: activeConversations,
      hint: 'bot respondiendo',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      label: 'Documentos',
      value: readyDocuments,
      hint: 'en knowledge base',
      icon: DocumentTextIcon,
    },
  ]

  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Inicio</span>
        {trialDaysLeft !== null && (
          <Badge variant="warning" size="md">
            {trialDaysLeft === 0 ? 'Trial vencido' : `${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''} de prueba`}
          </Badge>
        )}
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-8 bg-background flex flex-col gap-10 overflow-auto">

        {/* Bienvenida */}
        <div
          className="relative overflow-hidden rounded-2xl bg-card border border-border px-8 py-10 sm:px-10 sm:py-12"
          style={{ animation: 'fade-in-up 420ms cubic-bezier(0.23,1,0.32,1) both' }}
        >
          <div
            className="absolute -top-28 -right-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-accent/6 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              Buen día{firstName ? <>, <span className="text-accent-on-surface">{firstName}</span></> : null}
            </h1>
            <p className="text-sm text-muted-foreground mt-3">Aquí está el resumen de tu cuenta</p>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {metrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.label}
                className="group relative overflow-hidden bg-card border border-border rounded-2xl p-6 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/30"
                style={{
                  animation: `fade-in-up 420ms cubic-bezier(0.23,1,0.32,1) ${60 + i * 60}ms both`,
                }}
              >
                <Icon
                  className="absolute -right-3 -bottom-3 w-24 h-24 text-muted-foreground/7 transition-colors duration-200 group-hover:text-accent/12"
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ boxShadow: `0 16px 32px -16px var(--accent-shadow)` }}
                  aria-hidden="true"
                />
                <div className="relative">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {metric.label}
                  </div>
                  <div className="text-4xl font-bold text-foreground tabular-nums">{metric.value}</div>
                  <div className="text-xs text-subtle-foreground mt-2">{metric.hint}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Conversaciones recientes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-foreground">Conversaciones recientes</span>
            <Link
              href="/dashboard/conversations"
              className="text-sm text-accent-on-surface hover:underline inline-flex items-center gap-1 group"
            >
              Ver todas
              <ArrowRightIcon className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {recentConversations.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl">
              <EmptyState
                icon={ChatBubbleLeftRightIcon}
                title="Todavía no hay conversaciones"
                description="Conectá WhatsApp para empezar a recibir mensajes de tus clientes."
                action={
                  <Link
                    href="/dashboard/integrations"
                    className="text-sm font-medium text-accent-foreground bg-accent hover:bg-accent-hover transition-colors px-4 py-2 rounded-lg active:scale-[0.97] inline-block"
                  >
                    Conectar WhatsApp
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentConversations.map((conv, i) => {
                const initials = getInitials(conv.customer_name, conv.customer_phone)
                const displayName = conv.customer_name || conv.customer_phone
                const preview = conv.last_message
                  ? (conv.last_message_role === 'assistant' ? `Bot: ${conv.last_message}` : conv.last_message)
                  : 'Sin mensajes'

                return (
                  <Link
                    key={conv.id}
                    href="/dashboard/conversations"
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_12px_24px_-12px_var(--accent-shadow)]"
                    style={{
                      animation: `fade-in-up 360ms cubic-bezier(0.23,1,0.32,1) ${i * 40}ms both`,
                    }}
                  >
                    <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground min-w-9">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">{preview}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs text-subtle-foreground">{formatRelativeTime(conv.updated_at)}</span>
                      <div className={`w-2 h-2 rounded-full ${STATUS_DOT[conv.status] ?? 'bg-subtle-foreground'}`} />
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
