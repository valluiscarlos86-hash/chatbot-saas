import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

/**
 * Raíz del sitio.
 *
 * Esta ruta contenía una copia del panel de inicio y el middleware la declara
 * pública, de modo que un visitante sin sesión veía la estructura del panel con
 * todos los indicadores en cero y el saludo dirigido a "Usuario". No había
 * ninguna página de presentación: la raíz y el panel eran el mismo componente.
 *
 * Mientras no exista una página de presentación propia, la raíz solo decide a
 * dónde corresponde llevar a quien llega: al panel si hay sesión activa, al
 * formulario de inicio de sesión si no la hay. Así ninguna ruta pública expone
 * la estructura de una cuenta.
 */
export default async function RootPage() {
  const { userId } = await auth()
  redirect(userId ? '/dashboard' : '/sign-in')
}
