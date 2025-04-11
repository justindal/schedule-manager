'use client'

import { createClientBrowser } from '@/app/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function ContinueButton({
  role,
  variant,
}: {
  role: 'employee' | 'manager'
  variant?: 'default' | 'outline'
}) {
  const router = useRouter()

  const handleClick = async () => {
    const supabase = createClientBrowser()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === role) {
        router.push(`/${role}`)
      } else {
        router.push(`/${role}/login`)
      }
    } else {
      router.push(`/${role}/login`)
    }
  }

  return (
    <Button
      className='w-full'
      variant={variant}
      size='lg'
      onClick={handleClick}
    >
      Continue as {role.charAt(0).toUpperCase() + role.slice(1)}
    </Button>
  )
}
