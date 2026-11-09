import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()

  // La raíz no tiene página propia: solo decide a dónde corresponde llevar a
  // quien llega. La decisión se toma acá, en el middleware, y no en un
  // componente de servidor, porque de ese modo la redirección ocurre antes de
  // renderizar nada. Resolverla dentro de la página dejaba la respuesta a
  // medio transmitir y el navegador mostraba una pantalla en blanco.
  if (request.nextUrl.pathname === '/') {
    const destino = userId ? '/dashboard' : '/sign-in'
    return NextResponse.redirect(new URL(destino, request.url))
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
