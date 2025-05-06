'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'

export async function signInWithGoogle() {
  const supabase = await createClient()

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
    },
  })

  if (error) {
    console.error('Google Sign-In Error:', error)
    redirect('/auth/auth-code-error?message=Google+Sign-In+failed')
  }

  if (data.url) {
    return redirect(data.url)
  } else {
    redirect('/auth/auth-code-error?message=Could+not+get+Google+OAuth+URL')
  }
}
