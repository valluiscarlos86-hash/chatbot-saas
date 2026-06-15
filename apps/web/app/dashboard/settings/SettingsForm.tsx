'use client'

import { useState } from 'react'
import { SignOutButton } from '@clerk/nextjs'
import { updateAccountName } from './actions'

interface Props {
  firstName: string | null
  email: string | null
}

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
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <span className="text-emerald-600 text-sm">✓</span>
          <span className="text-sm text-emerald-700 font-medium">Nombre actualizado correctamente</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Mi cuenta</h2>
        <form action={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Nombre</label>
              <input
                name="firstName"
                type="text"
                defaultValue={firstName ?? ''}
                placeholder="Tu nombre"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#10B981]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">
                Email <span className="text-gray-400 font-normal">(solo lectura)</span>
              </label>
              <input
                type="email"
                defaultValue={email ?? ''}
                readOnly
                tabIndex={-1}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full bg-[#10B981] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-red-100 p-6">
        <h2 className="text-sm font-semibold text-red-600 mb-4">Zona de peligro</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">Cerrar sesión</div>
            <div className="text-xs text-gray-400 mt-0.5">Salir de tu cuenta en este dispositivo</div>
          </div>
          <SignOutButton>
            <button className="px-4 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200">
              Cerrar sesión
            </button>
          </SignOutButton>
        </div>
      </div>
    </>
  )
}
