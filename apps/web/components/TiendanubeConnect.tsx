'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface TiendanubeConnectProps {
  variant?: 'card' | 'inline'
  onConnected?: () => void
  onDisconnected?: () => void
  refreshSignal?: string | number | null
}

export default function TiendanubeConnect({ variant = 'card', onConnected, onDisconnected, refreshSignal }: TiendanubeConnectProps) {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const checkStatus = useCallback(() => {
    setLoading(true)
    fetch('/api/tiendanube/status')
      .then(res => res.json())
      .then(data => {
        setConnected(!!data.connected)
        setLoading(false)
        if (data.connected) onConnected?.()
      })
      .catch(() => setLoading(false))
  }, [onConnected])

  useEffect(() => { checkStatus() }, [checkStatus])

  useEffect(() => {
    if (refreshSignal) checkStatus()
  }, [refreshSignal, checkStatus])

  async function handleConnect() {
    setConnecting(true)
    try {
      const res = await fetch('/api/tiendanube/connect')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setConnecting(false)
      }
    } catch {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/tiendanube/disconnect', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setConnected(false)
        onDisconnected?.()
      }
    } catch {
      // noop — el badge se queda como "Conectado" y el usuario puede reintentar
    } finally {
      setDisconnecting(false)
    }
  }

  if (variant === 'inline') {
    if (loading) {
      return <div className="h-9 w-40 bg-card-hover rounded-lg animate-pulse" />
    }
    if (connected) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">Conectado</Badge>
          <Button size="sm" variant="secondary" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? 'Desconectando...' : 'Desconectar'}
          </Button>
        </div>
      )
    }
    return (
      <Button size="sm" onClick={handleConnect} disabled={connecting}>
        {connecting ? 'Conectando...' : 'Conectar Tiendanube'}
      </Button>
    )
  }

  return (
    <Card padding="md">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
          style={{ backgroundColor: '#F06000' }}
        >
          TN
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">Tiendanube</div>
          <div className="text-xs text-subtle-foreground mt-0.5">
            Conectá tu tienda para que el bot responda preguntas de stock, productos y precios en tiempo real.
          </div>
        </div>
        {!loading && (
          <Badge variant={connected ? 'success' : 'neutral'} size="md">
            {connected ? 'Conectado' : 'No conectado'}
          </Badge>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-border">
        {loading ? (
          <div className="h-9 w-40 bg-card-hover rounded-lg animate-pulse" />
        ) : connected ? (
          <Button size="sm" variant="secondary" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? 'Desconectando...' : 'Desconectar'}
          </Button>
        ) : (
          <Button size="sm" onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Conectando...' : 'Conectar Tiendanube'}
          </Button>
        )}
      </div>
    </Card>
  )
}
