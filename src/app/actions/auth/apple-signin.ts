'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'

export async function signInWithApple(role: 'manager' | 'employee') {
  const supabase = await createClient()

  const callbackUrl = new URL(
    `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
  )
  callbackUrl.searchParams.set('role', role)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: 'name email',
    },
  })

  if (error) {
    console.error('Apple sign-in error:', error)
    redirect('/auth/auth-code-error')
  }

  return redirect(data.url)
}
