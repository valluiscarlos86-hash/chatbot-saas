import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { NextResponse, NextRequest } from 'next/server'

export async function PATCH(
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

  const res = await fetch(`http://localhost:3001/conversations/${id}/metadata`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, orgId }),
  })
  const data = await res.json()
  return NextResponse.json(data)
}
