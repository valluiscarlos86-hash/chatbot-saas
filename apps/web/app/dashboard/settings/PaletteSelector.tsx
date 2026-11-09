'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { PALETTES, PALETTE_LABELS, PALETTE_PREVIEWS, type Palette } from '@/lib/palettes'

interface Props {
  initialPalette: Palette
}

export default function PaletteSelector({ initialPalette }: Props) {
  const { user } = useUser()
  const router = useRouter()
  const [selected, setSelected] = useState<Palette>(initialPalette)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(palette: Palette) {
    if (palette === selected || saving || !user) return

    const previous = selected
    setError(null)
    setSaving(true)
    try {
      await user.updateMetadata({ unsafeMetadata: { ...user.unsafeMetadata, palette } })
      setSelected(palette)
      router.refresh()
    } catch {
      setSelected(previous)
      setError('No se pudo guardar el tema, probá de nuevo')
      setTimeout(() => setError(null), 4000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tema de color</CardTitle>
          {saving && <span className="text-xs text-subtle-foreground">Guardando...</span>}
        </div>
      </CardHeader>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PALETTES.map((palette) => {
          const preview = PALETTE_PREVIEWS[palette]
          const isSelected = selected === palette
          return (
            <button
              key={palette}
              type="button"
              onClick={() => handleSelect(palette)}
              disabled={saving}
              className={`relative flex flex-col gap-2.5 rounded-lg border p-3 text-left transition-colors disabled:opacity-60 ${
                isSelected
                  ? 'border-accent bg-accent-subtle'
                  : 'border-border hover:bg-card-hover'
              }`}
            >
              {isSelected && (
                <CheckCircleIcon className="w-4 h-4 text-accent-on-surface absolute top-2 right-2" />
              )}
              <div className="flex gap-1.5">
                <span
                  className="w-5 h-5 rounded-md border border-border/50"
                  style={{ backgroundColor: preview.sidebar }}
                />
                <span
                  className="w-5 h-5 rounded-md border border-border/50"
                  style={{ backgroundColor: preview.accent }}
                />
                <span
                  className="w-5 h-5 rounded-md border border-border/50"
                  style={{ backgroundColor: preview.bg }}
                />
              </div>
              <span className="text-xs font-medium text-foreground">{PALETTE_LABELS[palette]}</span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-danger mt-3">{error}</p>}
    </Card>
  )
}
