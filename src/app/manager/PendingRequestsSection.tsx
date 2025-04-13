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
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Store {
  id: string
  name: string
}

interface PendingRequest {
  store_id: string
  store: Store
  manager: {
    id: string
    full_name: string
    email: string
  }
}

interface Props {
  requests: PendingRequest[]
}

export function PendingRequestsSection({ requests }: Props) {
  const router = useRouter()

  async function handleRequest(
    request: PendingRequest,
    action: 'approved' | 'rejected'
  ) {
    const supabase = createClientBrowser()
    const { error } = await supabase
      .from('store_managers')
      .update({ status: action })
      .eq('store_id', request.store_id)
      .eq('manager_id', request.manager.id)

    if (error) {
      console.error(
        `Error ${action === 'approved' ? 'approving' : 'rejecting'} request:`,
        error
      )
      return
    }

    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Bell className='w-5 h-5 text-yellow-500' />
          <CardTitle>Pending Manager Requests</CardTitle>
        </div>
        <CardDescription>
          These users have requested to join your stores as managers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {requests.map((request) => (
            <div
              key={`${request.store_id}-${request.manager.id}`}
              className='flex items-center justify-between'
            >
              <div>
                <div className='font-medium'>{request.manager.full_name}</div>
                <div className='text-sm text-muted-foreground'>
                  {request.manager.email}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Store: {request.store.name}
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleRequest(request, 'approved')}
                  className='text-green-600 hover:text-green-700'
                >
                  Approve
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleRequest(request, 'rejected')}
                  className='text-red-600 hover:text-red-700'
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
