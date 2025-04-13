'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { leaveStore } from '../actions'

export function LeaveStoreButton({ storeId }: { storeId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLeaveStore = async () => {
    if (!confirm('Are you sure you want to leave this store?')) return

    try {
      setIsLoading(true)

      const result = await leaveStore(storeId)

      if (!result.success) {
        alert(result.error)
        return
      }

      // redirect back to dashboard after success
      router.refresh()
      router.push('/employee')
    } catch (error) {
      alert('Failed to leave store. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant='destructive'
      size='sm'
      onClick={handleLeaveStore}
      disabled={isLoading}
      className='text-xs h-8 whitespace-nowrap min-w-[70px]'
    >
      <LogOut className='h-3 w-3 mr-1.5' />
      {isLoading ? 'Leaving...' : 'Leave'}
    </Button>
  )
}
