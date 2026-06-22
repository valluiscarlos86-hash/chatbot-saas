'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  PhoneIcon,
  GlobeAltIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface WhatsappAccount {
  phoneNumber: string
  phoneNumberId: string
  businessAccountId: string | null
  accessTokenMasked: string | null
  widgetMessage: string | null
  isActive: boolean
}

const inputClasses =
  'w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-accent transition-colors duration-200'

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
      <div className="bg-card border-b border-border px-6 py-3">
        <span className="text-sm font-medium text-foreground">Integraciones</span>
      </div>
      <div className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">

          {/* WhatsApp */}
          <Card padding="md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center shrink-0">
                <PhoneIcon className="w-6 h-6 text-accent-on-surface" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">WhatsApp Business</div>
                <div className="text-xs text-subtle-foreground mt-0.5">Conectá tu número de WhatsApp para recibir y responder mensajes</div>
              </div>
              {!loading && (
                <Badge variant={isConnected ? 'success' : 'neutral'} size="md">
                  {isConnected ? 'Conectado' : 'No conectado'}
                </Badge>
              )}
            </div>

            {!loading && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-4 border-t border-border">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Número de teléfono</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="Ej: +54 9 11 1234-5678"
                    required
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phone Number ID</label>
                  <input
                    type="text"
                    value={phoneNumberId}
                    onChange={e => setPhoneNumberId(e.target.value)}
                    placeholder="ID de la API de WhatsApp Business"
                    required
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Business Account ID (opcional)</label>
                  <input
                    type="text"
                    value={businessAccountId}
                    onChange={e => setBusinessAccountId(e.target.value)}
                    placeholder="ID de la cuenta de WhatsApp Business"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Access Token{' '}
                    {account?.accessTokenMasked && (
                      <span className="text-subtle-foreground font-normal">(actual: {account.accessTokenMasked})</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                    placeholder={account ? 'Dejar vacío para mantener el actual' : 'Token de acceso de la API'}
                    required={!account}
                    className={inputClasses}
                  />
                </div>

                {error && <p className="text-xs text-danger">{error}</p>}
                {saved && <p className="text-xs text-accent-on-surface">Credenciales guardadas correctamente</p>}

                <Button type="submit" disabled={saving} size="sm" className="mt-2 self-start">
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </form>
            )}
          </Card>

          {/* Widget web */}
          <Card padding="md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center shrink-0">
                <GlobeAltIcon className="w-6 h-6 text-accent-on-surface" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Widget para tu web</div>
                <div className="text-xs text-subtle-foreground mt-0.5">Botón flotante que redirige a tu WhatsApp</div>
              </div>
              <Button size="sm" onClick={() => setWidgetOpen(open => !open)}>
                {widgetOpen ? 'Cerrar' : 'Configurar'}
              </Button>
            </div>

            {widgetOpen && (
              <div className="pt-4 mt-4 border-t border-border">
                {!isConnected ? (
                  <p className="text-xs text-warning bg-warning-subtle border border-warning/20 rounded-lg px-3 py-2.5">
                    Conectá tu WhatsApp arriba primero
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">Mensaje predefinido</label>
                      <input
                        type="text"
                        value={widgetMessage}
                        onChange={e => setWidgetMessage(e.target.value)}
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">Vista previa</label>
                      <div className="relative h-24 bg-background border border-border rounded-lg overflow-hidden">
                        <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center shadow-md">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.95.55 3.77 1.5 5.32L2 22l4.93-1.55a9.85 9.85 0 0 0 5.11 1.4h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.06h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.98.99-3.04-.2-.31a8.15 8.15 0 0 1-1.26-4.33c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.85 5.8 2.41a8.15 8.15 0 0 1 2.4 5.8c0 4.52-3.68 8.2-8.2 8.2zm4.5-6.15c-.25-.12-1.46-.72-1.68-.8-.23-.08-.4-.12-.56.12-.17.25-.64.8-.79.97-.14.16-.29.18-.54.06-1.46-.73-2.42-1.3-3.38-2.95-.26-.44.26-.41.74-1.37.08-.16.04-.3-.03-.42-.07-.12-.6-1.45-.82-1.98-.22-.52-.44-.45-.6-.46-.16-.01-.34-.01-.52-.01-.18 0-.46.07-.71.32-.25.25-.94.92-.94 2.24 0 1.32.96 2.6 1.1 2.78.13.18 1.86 2.84 4.5 3.87 2.22.87 2.67.7 3.15.65.48-.05 1.46-.6 1.66-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.48-.27z"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Código para pegar antes de &lt;/body&gt;</label>
                        <button
                          onClick={handleCopySnippet}
                          className="text-xs text-accent-on-surface hover:underline font-medium transition-colors duration-200"
                        >
                          {copied ? '¡Copiado!' : 'Copiar código'}
                        </button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 text-[11px] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                        {account && buildWidgetSnippet(account.phoneNumber, widgetMessage)}
                      </pre>
                    </div>

                    <div className="flex gap-2 text-xs text-muted-foreground bg-card-hover border border-border rounded-lg p-3">
                      <InformationCircleIcon className="w-4 h-4 text-subtle-foreground shrink-0" />
                      <div className="flex flex-col gap-1">
                        <p><strong className="text-foreground">¿Qué hago con este código?</strong></p>
                        <p>• <strong>WordPress:</strong> pegalo en la sección de "código personalizado" de tu tema, o usá un plugin de HTML personalizado.</p>
                        <p>• <strong>Tenés un programador o agencia:</strong> pasale este código y pedile que lo pegue antes de &lt;/body&gt;.</p>
                        <p>• <strong>Wix, Tiendanube o Shopify:</strong> buscá la sección "código personalizado" o "HTML embebido" en la configuración del sitio.</p>
                        <p>• <strong>Manejás vos los archivos HTML:</strong> pegalo justo antes de la etiqueta &lt;/body&gt;, al final del archivo.</p>
                        <p className="pt-1">¿No estás seguro? Escribinos y te ayudamos a instalarlo.</p>
                      </div>
                    </div>

                    {widgetSaved && <p className="text-xs text-accent-on-surface">Mensaje guardado correctamente</p>}

                    <Button size="sm" disabled={savingWidget} onClick={handleSaveWidget} className="self-start">
                      {savingWidget ? 'Guardando...' : 'Guardar mensaje'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  )
}
