import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

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

  const res = await fetch('http://localhost:3001/tiendanube/products', {
    headers: { 'x-org-id': orgId },
  })
  return NextResponse.json(await res.json())
}
