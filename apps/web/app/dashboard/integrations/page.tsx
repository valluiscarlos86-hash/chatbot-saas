'use client'

import { useEffect, useState, type FormEvent } from 'react'

interface WhatsappAccount {
  phoneNumber: string
  phoneNumberId: string
  businessAccountId: string | null
  accessTokenMasked: string | null
  isActive: boolean
}

export default function IntegrationsPage() {
  const [account, setAccount] = useState<WhatsappAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState('')
  const [accessToken, setAccessToken] = useState('')

  useEffect(() => {
    fetch('/api/whatsapp-accounts')
      .then(res => res.json())
      .then(data => {
        if (data.account) {
          setAccount(data.account)
          setPhoneNumber(data.account.phoneNumber ?? '')
          setPhoneNumberId(data.account.phoneNumberId ?? '')
          setBusinessAccountId(data.account.businessAccountId ?? '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/whatsapp-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, phoneNumberId, businessAccountId, accessToken }),
    })
    const data = await res.json()
    setSaving(false)

    if (data.error) {
      setError(data.error)
      return
    }

    setAccessToken('')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)

    const refreshed = await fetch('/api/whatsapp-accounts').then(r => r.json())
    if (refreshed.account) setAccount(refreshed.account)
  }

  const isConnected = !!account?.isActive

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <span className="text-sm font-medium text-gray-700">Integraciones</span>
      </div>
      <div className="flex-1 p-6 bg-gray-50 overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">

          {/* WhatsApp */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl min-w-12">
                📱
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">WhatsApp Business</div>
                <div className="text-xs text-gray-400 mt-0.5">Conectá tu número de WhatsApp para recibir y responder mensajes</div>
              </div>
              {!loading && (
                <span
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}
                >
                  {isConnected ? 'Conectado' : 'No conectado'}
                </span>
              )}
            </div>

            {!loading && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Número de teléfono</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="Ej: +54 9 11 1234-5678"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Phone Number ID</label>
                  <input
                    type="text"
                    value={phoneNumberId}
                    onChange={e => setPhoneNumberId(e.target.value)}
                    placeholder="ID de la API de WhatsApp Business"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Business Account ID (opcional)</label>
                  <input
                    type="text"
                    value={businessAccountId}
                    onChange={e => setBusinessAccountId(e.target.value)}
                    placeholder="ID de la cuenta de WhatsApp Business"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">
                    Access Token{' '}
                    {account?.accessTokenMasked && (
                      <span className="text-gray-400 font-normal">(actual: {account.accessTokenMasked})</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                    placeholder={account ? 'Dejar vacío para mantener el actual' : 'Token de acceso de la API'}
                    required={!account}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}
                {saved && <p className="text-xs text-emerald-600">Credenciales guardadas correctamente</p>}

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-2 self-start px-4 py-2 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </form>
            )}
          </div>

          {/* Widget web */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl min-w-12">
              🌐
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">Widget para tu web</div>
              <div className="text-xs text-gray-400 mt-0.5">Agregá un chat en tu sitio web con un pequeño script</div>
            </div>
            <button className="px-4 py-2 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669] transition-colors">
              Configurar
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
