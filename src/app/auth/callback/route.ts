import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log(
    `Callback received. Origin: ${origin}, Code: ${code}, Next: ${next}`
  )

  if (code) {
    const supabase = await createClient()
    console.log('Attempting to exchange code for session...')
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    )
    if (!exchangeError) {
      console.log('Code exchange successful. Redirecting...')
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error('Error exchanging code for session:', exchangeError.message)
    }
  } else {
    console.warn('Callback received without a code parameter.')
  }

  console.log('Redirecting to auth-code-error page.')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
