'use client'

import { useState } from 'react'
import { SignOutButton } from '@clerk/nextjs'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { updateAccountName } from './actions'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Props {
  firstName: string | null
  email: string | null
}

const inputClasses =
  'w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-accent transition-colors duration-200'

export default function SettingsForm({ firstName, email }: Props) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    await updateAccountName(formData)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
      {saved && (
        <div className="bg-accent-subtle border border-accent/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-accent-on-surface shrink-0" />
          <span className="text-sm text-accent-on-surface font-medium">Nombre actualizado correctamente</span>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Mi cuenta</CardTitle></CardHeader>
        <form action={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nombre</label>
              <input
                name="firstName"
                type="text"
                defaultValue={firstName ?? ''}
                placeholder="Tu nombre"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Email <span className="text-subtle-foreground font-normal">(solo lectura)</span>
              </label>
              <input
                type="email"
                defaultValue={email ?? ''}
                readOnly
                tabIndex={-1}
                className="w-full bg-card-hover border border-border rounded-lg px-3 py-2 text-sm text-subtle-foreground cursor-not-allowed"
              />
            </div>
          </div>
          <Button type="submit" disabled={saving} className="mt-5 w-full">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </Card>

      <div className="bg-card border border-danger/20 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-danger mb-4">Zona de peligro</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Cerrar sesión</div>
            <div className="text-xs text-subtle-foreground mt-0.5">Salir de tu cuenta en este dispositivo</div>
          </div>
          <SignOutButton>
            <Button variant="danger" size="sm">Cerrar sesión</Button>
          </SignOutButton>
        </div>
      </div>
    </>
  )
}
