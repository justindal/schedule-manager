'use server'

import { createClient } from '@/app/utils/supabase/server'

export async function resetPassword(email: string) {
  const supabase = await createClient()

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : undefined)

  if (!siteUrl) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL environment variable must be set in production'
    )
  }

  const baseUrl = siteUrl.replace(/\/$/, '')
  console.log('forgot base: ' + baseUrl)
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/reset-password`,
  })

  if (error) {
    console.error('Error sending reset password email:', error)
    throw error
  }
}
