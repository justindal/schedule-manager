import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/app/utils/supabase/middleware'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const createClient = async (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete(name)

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          response.cookies.delete(name)
        },
      },
    }
  )

  return { supabase, response }
}

export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request)

  const url = new URL(request.url)
  const path = url.pathname

  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/auth/',
    '/contact',
    '/terms',
    '/privacy',
  ]

  if (
    publicPaths.some(
      (p) => path === p || (p.endsWith('/') && path.startsWith(p))
    )
  ) {
    return sessionResponse
  }

  const { supabase, response } = await createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !path.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
