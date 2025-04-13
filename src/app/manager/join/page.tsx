'use client'

import { createClientBrowser } from '@/app/utils/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinStore() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const supabase = createClientBrowser()
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
      setError('You must be logged in to join a store')
      return
    }

    console.log('Checking store code:', code.toUpperCase())
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('join_code', code.toUpperCase())
      .single()

    if (storeError) {
      console.error('Store lookup error:', storeError)
      setError('Invalid store code')
      return
    }

    if (!store) {
      console.log('No store found with code:', code.toUpperCase())
      setError('Invalid store code')
      return
    }

    console.log('Found store:', store)

    const { data: existingManager } = await supabase
      .from('store_managers')
      .select('status')
      .eq('store_id', store.id)
      .eq('manager_id', user.id)
      .single()

    if (existingManager) {
      console.log('Already a manager:', existingManager)
      setError(
        `You have already ${
          existingManager.status === 'pending' ? 'requested to join' : 'joined'
        } this store`
      )
      return
    }

    const { data: existingEmployee } = await supabase
      .from('store_employees')
      .select('*')
      .eq('store_id', store.id)
      .eq('employee_id', user.id)
      .maybeSingle()

    if (!existingEmployee) {
      const { error: employeeError } = await supabase
        .from('store_employees')
        .insert({
          store_id: store.id,
          employee_id: user.id,
        })

      if (employeeError) {
        console.error('Error adding as employee:', employeeError)
        setError(`Failed to add employee access: ${employeeError.message}`)
        return
      }

      console.log('Added user as an employee of the store')
    } else {
      console.log('User is already an employee of this store')
    }

    console.log('Submitting join request...')
    const { error: joinError } = await supabase.from('store_managers').insert({
      store_id: store.id,
      manager_id: user.id,
      is_primary: false,
      status: 'pending',
    })

    if (joinError) {
      console.error('Join error:', joinError)
      if (joinError.message?.includes('duplicate')) {
        setError('You have already requested to join this store')
      } else {
        setError(
          `Failed to submit join request: ${
            joinError.message || 'Unknown error'
          }`
        )
      }
      return
    }

    console.log('Join request submitted successfully')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className='container mx-auto py-8'>
        <Card className='max-w-md mx-auto'>
          <CardHeader>
            <CardTitle>Request Submitted</CardTitle>
            <CardDescription>
              Your request to join as a manager has been submitted. You'll have
              employee-level access immediately, but will need approval from an
              existing manager to gain manager privileges. You will be notified
              once your request is reviewed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/manager')} className='w-full'>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto py-8'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle>Join Store as Manager</CardTitle>
          <CardDescription>
            Submit a request to join a store as a manager. An existing manager
            will need to approve your request before you gain manager
            privileges. Until then, you'll have the same access as regular
            employees.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Input
                placeholder='Enter store code'
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
              />
              {error && <p className='text-sm text-red-500'>{error}</p>}
            </div>
            <Button type='submit' className='w-full'>
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
