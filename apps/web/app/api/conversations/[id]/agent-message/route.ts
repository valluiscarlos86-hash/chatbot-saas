import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { NextResponse, NextRequest } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const org = await db.execute(
    sql`SELECT id FROM organizations WHERE clerk_user_id = ${userId} LIMIT 1`
  )
  const orgId = org[0]?.id
  if (!orgId) return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })

  const { id } = await params
  const body = await req.json()

  const res = await fetch(`${BACKEND_URL}/conversations/${id}/agent-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, orgId }),
  })
  const data = await res.json()
  return NextResponse.json(data)
}
