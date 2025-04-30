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
      const userId = session.user.id

      if (role === 'manager') {
        const { data: managerData, error: managerError } = await supabase
          .from('store_managers')
          .select('store_id', { count: 'exact', head: true })
          .eq('manager_id', userId)

        if (managerData && managerData.count > 0) {
          router.push('/dashboard')
          return
        }
      } else if (role === 'employee') {
        const { data: employeeData, error: employeeError } = await supabase
          .from('store_employees')
          .select('store_id', { count: 'exact', head: true })
          .eq('employee_id', userId)

        if (employeeData && employeeData.count > 0) {
          router.push('/dashboard')
          return
        }
      }

      router.push(`/${role}/login`)
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
