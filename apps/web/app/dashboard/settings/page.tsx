import { currentUser } from '@clerk/nextjs/server'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const user = await currentUser()
  const firstName = user?.firstName ?? null
  const email = user?.emailAddresses[0]?.emailAddress ?? null

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <span className="text-sm font-medium text-gray-700">Configuración</span>
      </div>
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          <SettingsForm firstName={firstName} email={email} />

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Plan actual</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Plan gratuito</div>
                <div className="text-xs text-gray-400 mt-0.5">150 mensajes por mes · 1 agente</div>
              </div>
              <button className="px-4 py-2 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669] transition-colors">
                Mejorar plan
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
