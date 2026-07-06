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

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin
  const code = req.nextUrl.searchParams.get('code')

  const { userId } = await auth()

  if (!code || !userId) {
    return NextResponse.redirect(`${origin}/dashboard/documents?tiendanube=error`)
  }

  const orgId = await getOrgId(userId)
  if (!orgId) {
    return NextResponse.redirect(`${origin}/dashboard/documents?tiendanube=error`)
  }

  try {
    const res = await fetch(`${BACKEND_URL}/tiendanube/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orgId }),
    })
    const data = await res.json()

    if (data.success) {
      return NextResponse.redirect(`${origin}/dashboard/documents?tiendanube=success`)
    }
    return NextResponse.redirect(`${origin}/dashboard/documents?tiendanube=error`)
  } catch {
    return NextResponse.redirect(`${origin}/dashboard/documents?tiendanube=error`)
  }
}
