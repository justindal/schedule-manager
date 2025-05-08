'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientBrowser } from '@/app/utils/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'

interface Props {
  trigger: React.ReactNode
}

export function JoinStoreDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleJoinStore() {
    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a store code',
        variant: 'destructive',
      })
      return
    }

    const codeRegex = /^[A-Za-z0-9]{6}$/
    if (!codeRegex.test(code.trim())) {
      toast({
        title: 'Error',
        description: 'Store code must be 6 alphanumeric characters',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const supabase = createClientBrowser()
    const user = (await supabase.auth.getUser()).data.user

    try {
      console.log(
        'Starting join store process with code:',
        code.trim().toUpperCase()
      )

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
        .ilike('join_code', code.trim().toUpperCase())
        .single()

      if (storeError || !store) {
        console.log(
          'Invalid store code:',
          code.trim().toUpperCase(),
          'Error:',
          storeError
        )
        toast({
          title: 'Error',
          description: 'Invalid store code',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      console.log('Found store for join:', store)

      const { data: employeeData } = await supabase
        .from('store_employees')
        .select('*')
        .eq('store_id', store.id)
        .eq('employee_id', user?.id)
        .single()

      console.log('Employee check result:', employeeData)

      if (employeeData) {
        toast({
          title: 'Already Joined',
          description: `You are already part of ${store.name}`,
        })
        setOpen(false)
        setLoading(false)
        return
      }

      console.log('Joining store as employee:', store.id)

      const { data: joinResult, error: joinError } = await supabase
        .from('store_employees')
        .insert({
          store_id: store.id,
          employee_id: user?.id,
        })
        .select()

      console.log('Join result:', joinResult)

      if (joinError) {
        console.error('Error joining store:', joinError)
        toast({
          title: 'Error',
          description: `Failed to join store: ${joinError.message}`,
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      console.log('Successfully joined store:', store.name)
      toast({
        title: 'Success',
        description: `You've joined ${store.name} as an employee.`,
      })
      router.refresh()
      setOpen(false)
    } catch (error) {
      console.error('Error joining store:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className='sm:max-w-md rounded-lg'>
        <DialogHeader>
          <DialogTitle>Join Store</DialogTitle>
          <DialogDescription className='pt-2'>
            Enter the 6-character store code to join as an employee.
          </DialogDescription>
        </DialogHeader>
        <div className='py-6'>
          <Input
            placeholder='Store Code'
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className='h-11 text-center text-lg tracking-[0.3em] placeholder:tracking-normal'
            autoCapitalize='characters'
            autoCorrect='off'
          />
        </div>
        <DialogFooter className='gap-3 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            className='w-full sm:w-auto'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            onClick={handleJoinStore}
            disabled={loading}
            className='w-full sm:w-auto'
          >
            {loading ? 'Joining...' : 'Join Store'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
