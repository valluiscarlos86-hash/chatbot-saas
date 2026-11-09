/**
 * Raíz del sitio.
 *
 * El middleware redirige esta ruta antes de renderizarla —al panel si hay
 * sesión, al inicio de sesión si no la hay—, de modo que este componente no
 * llega a mostrarse. Se conserva porque Next.js requiere que la ruta exista.
 */
export default function RootPage() {
  return null
}
