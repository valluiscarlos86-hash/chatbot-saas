/**
 * Panel de presentación que acompaña a las pantallas de ingreso y registro.
 *
 * Hasta ahora el formulario de Clerk quedaba solo en una pantalla vacía. Este
 * panel ocupa la mitad restante y cumple la función de página de presentación:
 * dice en pocas líneas qué hace el producto. Se oculta en pantallas angostas,
 * donde el formulario pasa a ocupar el ancho completo.
 */

const PUNTOS = [
  {
    titulo: 'Responde con datos reales',
    detalle: 'Precio y stock del catálogo en vivo, no de un documento desactualizado.',
  },
  {
    titulo: 'No inventa',
    detalle: 'Si no tiene el dato, lo dice y deriva a una persona del equipo.',
  },
  {
    titulo: 'El control sigue siendo tuyo',
    detalle: 'Tomá cualquier conversación cuando quieras, desde el panel.',
  },
]

function Tilde() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="mt-0.5 h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5 8 14.5 16 6" />
    </svg>
  )
}

export function PanelPresentacion() {
  return (
    <aside className="relative hidden overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-center lg:px-16 xl:px-24">
      {/* Halo de color, muy tenue, para que el panel no sea un bloque plano */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'var(--accent)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'var(--accent)' }}
      />

      <div className="relative z-10 max-w-md">
        <span className="text-2xl font-semibold tracking-tight text-white">
          Atent<span style={{ color: 'var(--accent-on-surface)' }}>IA</span>
        </span>

        <h1 className="mt-10 text-4xl font-semibold leading-tight tracking-tight text-white xl:text-[2.75rem]">
          Atención al cliente
          <br />
          que no cierra.
        </h1>

        <p className="mt-5 text-base leading-relaxed text-gray-400">
          Tu negocio responde en WhatsApp las veinticuatro horas, con la
          información de tu propio catálogo y tus propios documentos.
        </p>

        <ul className="mt-12 space-y-7">
          {PUNTOS.map((punto) => (
            <li key={punto.titulo} className="flex gap-4">
              <span style={{ color: 'var(--accent-on-surface)' }}>
                <Tilde />
              </span>
              <div>
                <p className="text-sm font-medium text-white">{punto.titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-400">
                  {punto.detalle}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
