import { currentUser } from '@clerk/nextjs/server'
import SettingsForm from './SettingsForm'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default async function SettingsPage() {
  const user = await currentUser()
  const firstName = user?.firstName ?? null
  const email = user?.emailAddresses[0]?.emailAddress ?? null

  return (
    <div className="flex flex-col h-full">
      <div className="bg-card border-b border-border px-6 py-3">
        <span className="text-sm font-medium text-foreground">Configuración</span>
      </div>
      <div className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          <SettingsForm firstName={firstName} email={email} />

          <Card>
            <CardHeader><CardTitle>Plan actual</CardTitle></CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">Plan gratuito</div>
                <div className="text-xs text-subtle-foreground mt-0.5">150 mensajes por mes · 1 agente</div>
              </div>
              <Button size="sm">Mejorar plan</Button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
