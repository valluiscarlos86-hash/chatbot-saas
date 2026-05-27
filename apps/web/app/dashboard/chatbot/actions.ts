'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function saveChatbotConfig(formData: FormData): Promise<void> {
  const { userId } = await auth()
  console.log('userId de Clerk:', userId)
  console.log('buscando org con clerk_user_id:', userId)
  
  if (!userId) throw new Error('No autorizado')

  const org = await db.execute(
    sql`SELECT id FROM organizations WHERE clerk_user_id = ${userId} LIMIT 1`
  )
  
  console.log('org encontrada:', org)
  
  if (!org[0]) throw new Error('Organización no encontrada')

  const orgId = org[0].id as string

  const existing = await db.execute(
    sql`SELECT id FROM chatbot_configs WHERE org_id = ${orgId} LIMIT 1`
  )

  if (existing[0]) {
    await db.execute(sql`
      UPDATE chatbot_configs SET
        business_name = ${formData.get('businessName') as string},
        business_description = ${formData.get('businessDescription') as string},
        contact_info = ${formData.get('contactInfo') as string},
        bot_name = ${formData.get('botName') as string},
        bot_tone = ${formData.get('botTone') as string},
        welcome_message = ${formData.get('welcomeMessage') as string},
        escalation_rules = ${formData.get('escalationRules') as string},
        office_hours = ${formData.get('officeHours') as string},
        updated_at = now()
      WHERE org_id = ${orgId}
    `)
  } else {
    await db.execute(sql`
      INSERT INTO chatbot_configs (org_id, business_name, business_description, contact_info, bot_name, bot_tone, welcome_message, escalation_rules, office_hours)
      VALUES (
        ${orgId},
        ${formData.get('businessName') as string},
        ${formData.get('businessDescription') as string},
        ${formData.get('contactInfo') as string},
        ${formData.get('botName') as string},
        ${formData.get('botTone') as string},
        ${formData.get('welcomeMessage') as string},
        ${formData.get('escalationRules') as string},
        ${formData.get('officeHours') as string}
      )
    `)
  }

  revalidatePath('/dashboard/chatbot')
}