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

const metrics = [
  { label: 'Resolución del bot', value: '0%', hint: 'consultas sin humano', icon: CheckBadgeIcon },
  { label: 'Tiempo de respuesta', value: '0s', hint: 'promedio', icon: ClockIcon },
  { label: 'Conversaciones', value: '0', hint: 'este mes', icon: ChatBubbleLeftRightIcon },
  { label: 'Mensajes usados', value: '0', hint: 'de 150 disponibles', icon: EnvelopeIcon },
]

export default function AnalyticsPage() {
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

          {/* Gráfico placeholder */}
          <Card>
            <CardHeader><CardTitle>Conversaciones por día</CardTitle></CardHeader>
            <div className="h-40 flex flex-col items-center justify-center gap-2">
              <ChartBarIcon className="w-10 h-10 text-subtle-foreground/40" />
              <p className="text-sm text-subtle-foreground">Los gráficos aparecerán cuando tengas conversaciones</p>
            </div>
          </Card>

          {/* Preguntas frecuentes */}
          <Card>
            <CardHeader><CardTitle>Preguntas más frecuentes</CardTitle></CardHeader>
            <EmptyState
              icon={QuestionMarkCircleIcon}
              title="Todavía no hay datos suficientes"
            />
          </Card>

        </div>
      </div>
    </div>
  )
}
