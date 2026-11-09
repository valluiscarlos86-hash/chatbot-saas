import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import {
  CheckBadgeIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

interface DayPoint {
  dia: string
  cantidad: number
}

interface TopicRow {
  categoria: string
  cantidad: number
}

function formatSeconds(seconds: number): string {
  if (seconds <= 0) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

export default async function AnalyticsPage() {
  const { userId } = await auth()

  let messageLimit = 150
  let botResolutionRate = 0
  let avgResponseSeconds = 0
  let conversationsThisMonth = 0
  let messagesThisMonth = 0
  let perDay: DayPoint[] = []
  let topics: TopicRow[] = []

  if (userId) {
    const orgRows = await db.execute(
      sql`SELECT id, monthly_message_limit FROM organizations
          WHERE clerk_user_id = ${userId} LIMIT 1`
    )
    const org = orgRows[0] as any

    if (org) {
      messageLimit = org.monthly_message_limit ?? 150
      const orgId = org.id as string

      const [resolutionRows, responseRows, convRows, msgRows, dayRows, topicRows] =
        await Promise.all([
          // Conversaciones del mes resueltas sin intervención humana
          db.execute(sql`
            SELECT
              COUNT(*)::int                                            AS total,
              COUNT(*) FILTER (WHERE assigned_agent_id IS NULL)::int   AS sin_humano
            FROM conversations
            WHERE org_id = ${orgId}
              AND created_at >= DATE_TRUNC('month', NOW())
          `),

          // Demora promedio entre la consulta del cliente y la respuesta del agente
          db.execute(sql`
            WITH pares AS (
              SELECT
                created_at,
                role,
                LEAD(created_at) OVER (PARTITION BY conversation_id ORDER BY created_at) AS siguiente,
                LEAD(role)       OVER (PARTITION BY conversation_id ORDER BY created_at) AS rol_siguiente
              FROM messages
              WHERE org_id = ${orgId}
                AND role <> 'system'
                AND created_at >= DATE_TRUNC('month', NOW())
            )
            SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (siguiente - created_at))), 0)::float AS segundos
            FROM pares
            WHERE role = 'user' AND rol_siguiente = 'assistant'
          `),

          db.execute(sql`
            SELECT COUNT(*)::int AS count FROM conversations
            WHERE org_id = ${orgId} AND created_at >= DATE_TRUNC('month', NOW())
          `),

          db.execute(sql`
            SELECT COUNT(*)::int AS count FROM messages
            WHERE org_id = ${orgId} AND created_at >= DATE_TRUNC('month', NOW())
          `),

          // Conversaciones iniciadas por día, últimos 14 días
          db.execute(sql`
            SELECT TO_CHAR(d, 'DD/MM') AS dia, COUNT(c.id)::int AS cantidad
            FROM generate_series(
              DATE_TRUNC('day', NOW()) - interval '13 days',
              DATE_TRUNC('day', NOW()),
              interval '1 day'
            ) d
            LEFT JOIN conversations c
              ON c.org_id = ${orgId}
             AND DATE_TRUNC('day', c.created_at) = d
            GROUP BY d
            ORDER BY d
          `),

          // Temas más consultados por los clientes
          db.execute(sql`
            SELECT categoria, COUNT(*)::int AS cantidad FROM (
              SELECT CASE
                WHEN content ILIKE '%talle%'  OR content ILIKE '%calza%'                                      THEN 'Talles y calce'
                WHEN content ILIKE '%precio%' OR content ILIKE '%cuesta%' OR content ILIKE '%vale%'            THEN 'Precios'
                WHEN content ILIKE '%stock%'  OR content ILIKE '%disponib%' OR content ILIKE '%tienen%'        THEN 'Stock y disponibilidad'
                WHEN content ILIKE '%env%o%'  OR content ILIKE '%correo%' OR content ILIKE '%mandan%'          THEN 'Envíos'
                WHEN content ILIKE '%pago%'   OR content ILIKE '%tarjeta%' OR content ILIKE '%cuota%'
                                              OR content ILIKE '%transferencia%' OR content ILIKE '%efectivo%' THEN 'Medios de pago'
                WHEN content ILIKE '%cambi%'  OR content ILIKE '%devol%'                                       THEN 'Cambios y devoluciones'
                WHEN content ILIKE '%horario%' OR content ILIKE '%abiert%' OR content ILIKE '%abren%'
                                              OR content ILIKE '%cierran%'                                     THEN 'Horarios de atención'
                WHEN content ILIKE '%descuento%' OR content ILIKE '%promo%' OR content ILIKE '%oferta%'        THEN 'Descuentos y promociones'
                ELSE NULL
              END AS categoria
              FROM messages
              WHERE org_id = ${orgId} AND role = 'user'
            ) clasificados
            WHERE categoria IS NOT NULL
            GROUP BY categoria
            ORDER BY cantidad DESC, categoria ASC
            LIMIT 6
          `),
        ])

      const r = resolutionRows[0] as any
      const total = r?.total ?? 0
      botResolutionRate = total > 0 ? Math.round(((r?.sin_humano ?? 0) / total) * 100) : 0
      avgResponseSeconds = (responseRows[0] as any)?.segundos ?? 0
      conversationsThisMonth = (convRows[0] as any)?.count ?? 0
      messagesThisMonth = (msgRows[0] as any)?.count ?? 0
      perDay = dayRows as unknown as DayPoint[]
      topics = topicRows as unknown as TopicRow[]
    }
  }

  const metrics = [
    {
      label: 'Resolución del bot',
      value: `${botResolutionRate}%`,
      hint: 'consultas sin humano',
      icon: CheckBadgeIcon,
    },
    {
      label: 'Tiempo de respuesta',
      value: formatSeconds(avgResponseSeconds),
      hint: 'promedio',
      icon: ClockIcon,
    },
    {
      label: 'Conversaciones',
      value: String(conversationsThisMonth),
      hint: 'este mes',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      label: 'Mensajes usados',
      value: String(messagesThisMonth),
      hint: `de ${messageLimit} disponibles`,
      icon: EnvelopeIcon,
    },
  ]

  const maxDay = Math.max(1, ...perDay.map((d) => d.cantidad))
  const hasChartData = perDay.some((d) => d.cantidad > 0)
  const maxTopic = Math.max(1, ...topics.map((t) => t.cantidad))

  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-card border-b border-border px-6 py-3">
        <span className="text-sm font-medium text-foreground">Analítica</span>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-8 bg-background overflow-auto">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">

          {/* Métricas principales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {metrics.map((metric, i) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.label}
                  className="group relative overflow-hidden bg-card border border-border rounded-2xl p-5 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_16px_32px_-16px_var(--accent-shadow)]"
                  style={{ animation: `fade-in-up 420ms cubic-bezier(0.23,1,0.32,1) ${60 + i * 60}ms both` }}
                >
                  <Icon
                    className="absolute -right-3 -bottom-3 w-20 h-20 text-muted-foreground/7 transition-colors duration-200 group-hover:text-accent/12"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{metric.label}</div>
                    <div className="text-4xl font-bold text-foreground tabular-nums">{metric.value}</div>
                    <div className="text-xs text-subtle-foreground mt-2">{metric.hint}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Conversaciones por día */}
          <Card>
            <CardHeader><CardTitle>Conversaciones por día</CardTitle></CardHeader>
            {hasChartData ? (
              <div className="flex items-end gap-2 h-44 pt-2">
                {perDay.map((d) => (
                  <div key={d.dia} className="flex-1 flex flex-col items-center gap-2 h-full">
                    <span className="h-4 text-xs font-medium text-muted-foreground tabular-nums">
                      {d.cantidad > 0 ? d.cantidad : ''}
                    </span>
                    <div className="relative flex-1 w-full" title={`${d.cantidad} conversaciones`}>
                      <div
                        className={`absolute bottom-0 left-0 w-full rounded-t-md ${
                          d.cantidad > 0 ? 'bg-accent-on-surface' : 'bg-border'
                        }`}
                        style={{ height: d.cantidad > 0 ? `${(d.cantidad / maxDay) * 100}%` : '3px' }}
                      />
                    </div>
                    <span className="text-[10px] text-subtle-foreground tabular-nums whitespace-nowrap">
                      {d.dia}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center gap-2">
                <ChartBarIcon className="w-10 h-10 text-subtle-foreground/40" />
                <p className="text-sm text-subtle-foreground">Los gráficos aparecerán cuando tengas conversaciones</p>
              </div>
            )}
          </Card>

          {/* Preguntas más frecuentes */}
          <Card>
            <CardHeader><CardTitle>Preguntas más frecuentes</CardTitle></CardHeader>
            {topics.length > 0 ? (
              <div className="flex flex-col gap-3">
                {topics.map((t) => (
                  <div key={t.categoria} className="flex items-center gap-4">
                    <span className="w-52 shrink-0 text-sm text-foreground">{t.categoria}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-card-hover overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-on-surface"
                        style={{ width: `${(t.cantidad / maxTopic) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm font-medium text-muted-foreground tabular-nums">
                      {t.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={QuestionMarkCircleIcon}
                title="Todavía no hay datos suficientes"
              />
            )}
          </Card>

        </div>
      </div>
    </div>
  )
}
