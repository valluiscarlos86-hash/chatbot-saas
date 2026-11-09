import { SignUp } from '@clerk/nextjs'
import { PanelPresentacion } from '@/components/panel-presentacion'

export default function SignUpPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main className="flex items-center justify-center px-6 py-12">
        <SignUp />
      </main>
      <PanelPresentacion />
    </div>
  )
}
