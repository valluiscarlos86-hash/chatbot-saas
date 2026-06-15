'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function updateAccountName(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return

  const firstName = (formData.get('firstName') as string)?.trim() ?? ''

  const client = await clerkClient()
  await client.users.updateUser(userId, { firstName })

  revalidatePath('/dashboard')
}
