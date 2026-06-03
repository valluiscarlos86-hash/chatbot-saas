import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ config: null })

  const org = await db.execute(
    sql`SELECT id FROM organizations WHERE clerk_user_id = ${userId} LIMIT 1`
  )
  if (!org[0]) return NextResponse.json({ config: null })

  const config = await db.execute(
    sql`SELECT * FROM chatbot_configs WHERE org_id = ${org[0].id as string} LIMIT 1`
  )

  return NextResponse.json({ config: config[0] ?? null })
}