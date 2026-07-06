import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const org = await db.execute(
    sql`SELECT id FROM organizations WHERE clerk_user_id = ${userId} LIMIT 1`
  )
  const orgId = org[0]?.id
  if (!orgId) return NextResponse.json([])

  const res = await fetch(`${BACKEND_URL}/conversations?orgId=${orgId}`)
  const data = await res.json()
  return NextResponse.json(data)
}
