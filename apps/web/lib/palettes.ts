export const PALETTES = ["verde", "naranja", "negro-blanco", "negro-verde", "azul"] as const

export type Palette = (typeof PALETTES)[number]

export const PALETTE_LABELS: Record<Palette, string> = {
  verde: "Verde",
  naranja: "Naranja",
  "negro-blanco": "Negro & Blanco",
  "negro-verde": "Negro & Verde",
  azul: "Azul",
}

export const DEFAULT_PALETTE: Palette = "verde"

export const PALETTE_PREVIEWS: Record<Palette, { sidebar: string; accent: string; bg: string }> = {
  verde: { sidebar: "#111827", accent: "#10b981", bg: "#fafafa" },
  naranja: { sidebar: "#431407", accent: "#f97316", bg: "#fafafa" },
  "negro-blanco": { sidebar: "#09090b", accent: "#18181b", bg: "#fafafa" },
  "negro-verde": { sidebar: "#09090b", accent: "#10b981", bg: "#fafafa" },
  azul: { sidebar: "#0f1c3f", accent: "#2563eb", bg: "#fafafa" },
}

export function resolvePalette(value: unknown): Palette {
  if (typeof value === "string" && (PALETTES as readonly string[]).includes(value)) {
    return value as Palette
  }
  return DEFAULT_PALETTE
}
