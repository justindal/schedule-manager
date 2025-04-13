'use client'

import { createClientBrowser } from '@/app/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinStore() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!code.trim()) {
      setError('Please enter a store code')
      return
    }

    const codeRegex = /^[A-Za-z0-9]{6}$/
    if (!codeRegex.test(code.trim())) {
      setError('Store code must be 6 alphanumeric characters')
      return
    }

    const supabase = createClientBrowser()
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
      setError('You must be logged in to join a store')
      return
    }

    try {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
        .ilike('join_code', code.trim().toUpperCase())
        .single()

      if (storeError || !store) {
        console.error('Store error:', storeError)
        setError('Invalid store code')
        return
      }

      const { data: existingEmployee, error: existingError } = await supabase
        .from('store_employees')
        .select('*')
        .eq('store_id', store.id)
        .eq('employee_id', user.id)
        .maybeSingle()

      if (existingEmployee) {
        setError(`You are already an employee at ${store.name}`)
        return
      }

      const { error: joinError } = await supabase
        .from('store_employees')
        .insert({
          store_id: store.id,
          employee_id: user.id,
        })

      if (joinError) {
        console.error('Join error:', joinError)
        setError(`Failed to join store: ${joinError.message}`)
        return
      }

      router.push('/employee')
      router.refresh()
    } catch (error) {
      console.error('Unexpected error:', error)
      setError('An unexpected error occurred')
    }
  }

  return (
    <div className='container mx-auto py-8'>
      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle>Join Store</CardTitle>
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
              Join Store
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
