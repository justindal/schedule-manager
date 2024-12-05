'use client'

import { createClient } from '@/app/utils/supabase/client'
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

    const supabase = createClient()
    const user = (await supabase.auth.getUser()).data.user

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('join_code', code.toUpperCase())
      .single()

    if (storeError || !store) {
      setError('Invalid store code')
      return
    }

    const { error: joinError } = await supabase.from('store_employees').insert({
      store_id: store.id,
      employee_id: user?.id,
    })

    if (joinError) {
      setError('Failed to join store')
      return
    }

    router.push('/employee')
    router.refresh()
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
