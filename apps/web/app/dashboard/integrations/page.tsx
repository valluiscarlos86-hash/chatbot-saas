'use client'

import { useEffect, useState, type FormEvent } from 'react'

interface WhatsappAccount {
  phoneNumber: string
  phoneNumberId: string
  businessAccountId: string | null
  accessTokenMasked: string | null
  widgetMessage: string | null
  isActive: boolean
}

function buildWidgetSnippet(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `<a href="https://wa.me/${digits}?text=${encodedMessage}"
   target="_blank"
   rel="noopener noreferrer"
   style="position:fixed;bottom:20px;right:20px;width:56px;height:56px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.3);z-index:9999;text-decoration:none;">
  <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.95.55 3.77 1.5 5.32L2 22l4.93-1.55a9.85 9.85 0 0 0 5.11 1.4h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.06h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.98.99-3.04-.2-.31a8.15 8.15 0 0 1-1.26-4.33c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.85 5.8 2.41a8.15 8.15 0 0 1 2.4 5.8c0 4.52-3.68 8.2-8.2 8.2zm4.5-6.15c-.25-.12-1.46-.72-1.68-.8-.23-.08-.4-.12-.56.12-.17.25-.64.8-.79.97-.14.16-.29.18-.54.06-1.46-.73-2.42-1.3-3.38-2.95-.26-.44.26-.41.74-1.37.08-.16.04-.3-.03-.42-.07-.12-.6-1.45-.82-1.98-.22-.52-.44-.45-.6-.46-.16-.01-.34-.01-.52-.01-.18 0-.46.07-.71.32-.25.25-.94.92-.94 2.24 0 1.32.96 2.6 1.1 2.78.13.18 1.86 2.84 4.5 3.87 2.22.87 2.67.7 3.15.65.48-.05 1.46-.6 1.66-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.48-.27z"/></svg>
</a>`
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

  const [widgetOpen, setWidgetOpen] = useState(false)
  const [widgetMessage, setWidgetMessage] = useState('Hola, vengo de la web y quiero hacer una consulta')
  const [savingWidget, setSavingWidget] = useState(false)
  const [widgetSaved, setWidgetSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/whatsapp-accounts')
      .then(res => res.json())
      .then(data => {
        if (data.account) {
          setAccount(data.account)
          setPhoneNumber(data.account.phoneNumber ?? '')
          setPhoneNumberId(data.account.phoneNumberId ?? '')
          setBusinessAccountId(data.account.businessAccountId ?? '')
          if (data.account.widgetMessage) setWidgetMessage(data.account.widgetMessage)
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

  async function handleSaveWidget() {
    if (!account) return
    setSavingWidget(true)

    await fetch('/api/whatsapp-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: account.phoneNumber,
        phoneNumberId: account.phoneNumberId,
        businessAccountId: account.businessAccountId,
        widgetMessage,
      }),
    })

    setSavingWidget(false)
    setWidgetSaved(true)
    setTimeout(() => setWidgetSaved(false), 3000)

    const refreshed = await fetch('/api/whatsapp-accounts').then(r => r.json())
    if (refreshed.account) setAccount(refreshed.account)
  }

  async function handleCopySnippet() {
    if (!account) return
    const snippet = buildWidgetSnippet(account.phoneNumber, widgetMessage)
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl min-w-12">
                🌐
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">Widget para tu web</div>
                <div className="text-xs text-gray-400 mt-0.5">Botón flotante que redirige a tu WhatsApp</div>
              </div>
              <button
                onClick={() => setWidgetOpen(open => !open)}
                className="px-4 py-2 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669] transition-colors"
              >
                {widgetOpen ? 'Cerrar' : 'Configurar'}
              </button>
            </div>

            {widgetOpen && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                {!isConnected ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                    Conectá tu WhatsApp arriba primero
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1.5">Mensaje predefinido</label>
                      <input
                        type="text"
                        value={widgetMessage}
                        onChange={e => setWidgetMessage(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1.5">Vista previa</label>
                      <div className="relative h-24 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center shadow-md">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.95.55 3.77 1.5 5.32L2 22l4.93-1.55a9.85 9.85 0 0 0 5.11 1.4h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.06h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.98.99-3.04-.2-.31a8.15 8.15 0 0 1-1.26-4.33c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.85 5.8 2.41a8.15 8.15 0 0 1 2.4 5.8c0 4.52-3.68 8.2-8.2 8.2zm4.5-6.15c-.25-.12-1.46-.72-1.68-.8-.23-.08-.4-.12-.56.12-.17.25-.64.8-.79.97-.14.16-.29.18-.54.06-1.46-.73-2.42-1.3-3.38-2.95-.26-.44.26-.41.74-1.37.08-.16.04-.3-.03-.42-.07-.12-.6-1.45-.82-1.98-.22-.52-.44-.45-.6-.46-.16-.01-.34-.01-.52-.01-.18 0-.46.07-.71.32-.25.25-.94.92-.94 2.24 0 1.32.96 2.6 1.1 2.78.13.18 1.86 2.84 4.5 3.87 2.22.87 2.67.7 3.15.65.48-.05 1.46-.6 1.66-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.48-.27z"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-gray-600">Código para pegar antes de &lt;/body&gt;</label>
                        <button
                          onClick={handleCopySnippet}
                          className="text-xs text-[#10B981] hover:underline font-medium"
                        >
                          {copied ? '¡Copiado!' : 'Copiar código'}
                        </button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 text-[11px] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                        {account && buildWidgetSnippet(account.phoneNumber, widgetMessage)}
                      </pre>
                    </div>

                    {widgetSaved && <p className="text-xs text-emerald-600">Mensaje guardado correctamente</p>}

                    <button
                      onClick={handleSaveWidget}
                      disabled={savingWidget}
                      className="self-start px-4 py-2 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-60"
                    >
                      {savingWidget ? 'Guardando...' : 'Guardar mensaje'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
