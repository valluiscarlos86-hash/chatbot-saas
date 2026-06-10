    import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { NextResponse, NextRequest } from 'next/server'

async function getOrgId(userId: string) {
  const org = await db.execute(
    sql`SELECT id FROM organizations WHERE clerk_user_id = ${userId} LIMIT 1`
  )
  return org[0]?.id ?? null
}

// GET — listar documentos
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json([])

  const orgId = await getOrgId(userId)
  if (!orgId) return NextResponse.json([])

  const result = await db.execute(sql`
    SELECT id, name, file_type, file_size, status, chunk_count, created_at
    FROM knowledge_documents
    WHERE org_id = ${orgId as string}
    ORDER BY created_at DESC
  `)

  return NextResponse.json(result)
}

// DELETE — eliminar documento
export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  await db.execute(sql`DELETE FROM embeddings WHERE document_id = ${id}`)
  await db.execute(sql`DELETE FROM knowledge_documents WHERE id = ${id}`)

  return NextResponse.json({ success: true })
}