import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { NextResponse, NextRequest } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001'

async function getOrgId(userId: string) {
  const org = await db.execute(
    sql`SELECT id FROM organizations WHERE clerk_user_id = ${userId} LIMIT 1`
  )
  return org[0]?.id as string | undefined
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const orgId = await getOrgId(userId)
  if (!orgId) return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })

  const res = await fetch(`${BACKEND_URL}/whatsapp-accounts?orgId=${orgId}`)
  return NextResponse.json(await res.json())
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const orgId = await getOrgId(userId)
  if (!orgId) return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })

  const body = await req.json()

  const res = await fetch(`${BACKEND_URL}/whatsapp-accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, orgId }),
  })
  return NextResponse.json(await res.json())
}
