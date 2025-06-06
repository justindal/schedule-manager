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
import { toast } from '@/components/ui/use-toast'

const showError = (title: string, description: string) => {
  toast({
    title,
    description,
    variant: 'destructive',
  })
}

const showSuccess = (title: string, description: string) => {
  toast({
    title,
    description,
  })
}

export default function NewDashboardStore() {
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
        showError(
          'Authentication Error',
          'You must be logged in to create a store'
        )
        setLoading(false)
        return
      }

      const { data: joinCode, error: joinCodeError } = await supabase.rpc(
        'generate_store_join_code'
      )

      if (joinCodeError) {
        console.error('Error generating join code:', joinCodeError)
        showError('Error', 'Failed to generate join code')
        setLoading(false)
        return
      }

      console.log('Generated join code for new store:', joinCode)

      const { data: storeResult, error: createError } = await supabase.rpc(
        'create_store_with_manager',
        {
          store_name: formData.get('name') as string,
          store_address: formData.get('address') as string,
          store_phone: formData.get('phone') as string,
          join_code: joinCode,
          manager_id: user.id,
        }
      )

      if (createError) {
        console.error('Error creating store:', createError)
        showError('Error', `Failed to create store: ${createError.message}`)
        setLoading(false)
        return
      }

      showSuccess('Success', 'Store created successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (error: unknown) {
      console.error('Error creating store:', error)
      showError(
        'Error',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6'>
      <Card className='max-w-2xl mx-auto w-full'>
        <CardHeader>
          <CardTitle>Create New Store</CardTitle>
          <CardDescription>
            Enter the details for your new store location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Store Name</Label>
              <Input
                id='name'
                name='name'
                required
                placeholder='Downtown Store'
                className='w-full'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='address'>Address</Label>
              <Input
                id='address'
                name='address'
                required
                placeholder='123 Main St'
                className='w-full'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number</Label>
              <Input
                id='phone'
                name='phone'
                type='tel'
                placeholder='(555) 123-4567'
                className='w-full'
              />
            </div>

            <div className='flex flex-col-reverse sm:flex-row gap-3 pt-4 mt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={loading}
                className='w-full sm:w-auto'
              >
                {loading ? 'Creating...' : 'Create Store'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
