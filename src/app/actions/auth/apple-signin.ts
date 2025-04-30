'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'

export async function signInWithApple() {
  const supabase = await createClient()

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: callbackUrl,
      scopes: 'name email',
    },
  })

  if (error) {
    redirect('/auth/auth-code-error')
  }

  if (data.url) {
    return redirect(data.url)
  } else {
    redirect('/auth/auth-code-error')
  }
}
