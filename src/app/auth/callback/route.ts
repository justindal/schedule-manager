import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const role = searchParams.get('role') || 'employee'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (!profile && !profileError) {
        const email = data.user.email || ''
        const full_name =
          data.user.user_metadata?.name || email.split('@')[0] || 'User'

        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email,
            full_name,
            role,
          },
        ])
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      const rolePath = role === 'manager' ? '/manager' : '/employee'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${rolePath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${rolePath}`)
      } else {
        return NextResponse.redirect(`${origin}${rolePath}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
