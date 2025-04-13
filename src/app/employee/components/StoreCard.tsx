'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { LeaveStoreButton } from './LeaveStoreButton'

interface Store {
  id: string
  name: string
  address: string
}

export function StoreCard({ store }: { store: Store }) {
  if (!store?.id) {
    return (
      <div className='p-4 border rounded bg-red-50'>
        Error: Invalid store data
      </div>
    )
  }

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='p-4 pb-2'>
        <CardTitle className='font-medium text-sm sm:text-base'>
          {store.name}
        </CardTitle>
        <CardDescription className='text-xs sm:text-sm'>
          {store.address}
        </CardDescription>
      </CardHeader>
      <CardContent className='p-4 pt-0'>
        <div className='flex flex-wrap gap-2 w-full mt-2'>
          <Button
            variant='outline'
            size='sm'
            asChild
            className='flex-1 min-w-[80px] text-xs h-8'
          >
            <Link href={`/employee/store/${store.id}/schedule`}>
              <Calendar className='h-3 w-3 mr-1.5' />
              Schedule
            </Link>
          </Button>
          <Button
            variant='outline'
            size='sm'
            asChild
            className='flex-1 min-w-[80px] text-xs h-8'
          >
            <Link href={`/employee/store/${store.id}/availability`}>
              <Clock className='h-3 w-3 mr-1.5' />
              Availability
            </Link>
          </Button>
          <div className='flex-none'>
            <LeaveStoreButton storeId={store.id} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
