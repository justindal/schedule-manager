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
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewStore() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget as HTMLFormElement
    const formData = new FormData(form)

    try {
      const supabase = createClientBrowser()
      const user = (await supabase.auth.getUser()).data.user

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert([
          {
            name: formData.get('name'),
            address: formData.get('address'),
            phone_number: formData.get('phone'),
          },
        ])
        .select()
        .single()

      if (storeError) throw storeError

      const { error: managerError } = await supabase
        .from('store_managers')
        .insert([
          {
            store_id: store.id,
            manager_id: user.id,
            is_primary: true,
          },
        ])

      if (managerError) throw managerError

      router.push('/manager')
      router.refresh()
    } catch (error) {
      console.error('Error creating store:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container mx-auto py-8'>
      <Card className='max-w-2xl mx-auto'>
        <CardHeader>
          <CardTitle>Create New Store</CardTitle>
          <CardDescription>
            Enter the details for your new store location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Store Name</Label>
              <Input
                id='name'
                name='name'
                required
                placeholder='Downtown Store'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='address'>Address</Label>
              <Input
                id='address'
                name='address'
                required
                placeholder='123 Main St'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number</Label>
              <Input
                id='phone'
                name='phone'
                type='tel'
                placeholder='(555) 123-4567'
              />
            </div>

            <div className='flex gap-4 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? 'Creating...' : 'Create Store'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
