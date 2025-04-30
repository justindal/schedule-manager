import { NextResponse } from 'next/server'
import { createClient } from '@/app/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!existingProfile) {
        try {
          const email = data.user.email || ''
          const full_name =
            data.user.user_metadata?.name || email.split('@')[0] || 'User'
          const defaultRole = 'employee'

          await supabase.from('profiles').upsert(
            [
              {
                id: data.user.id,
                email,
                full_name,
                role: defaultRole,
              },
            ],
            { onConflict: 'id', ignoreDuplicates: true }
          )
        } catch (error) {}
      }

      const redirectPath = '/dashboard'
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    } else if (error) {
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
