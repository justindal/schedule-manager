import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/app/utils/supabase/server'
import { Store, LogOut, Calendar } from 'lucide-react'
import { signOut } from '@/app/actions/auth/login'

export async function EmployeeNavbar() {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  return (
    <nav className='border-b'>
      <div className='container mx-auto px-4 flex h-14 items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Link href='/employee' className='font-bold'>
            Employee Portal
          </Link>
          <div className='flex items-center space-x-2'>
            <Button variant='ghost' asChild>
              <Link href='/employee'>
                <Store className='w-4 h-4 mr-2' />
                My Stores
              </Link>
            </Button>
          </div>
        </div>
        <div className='flex items-center space-x-4'>
          <span className='text-sm text-muted-foreground'>{user?.email}</span>
          <form action={signOut}>
            <Button variant='ghost' size='icon' type='submit'>
              <LogOut className='w-4 h-4' />
            </Button>
          </form>
        </div>
      </div>
    </nav>
  )
}
