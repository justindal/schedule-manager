import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'

export function ScheduleSkeleton() {
  return (
    <div className='container mx-auto px-4 py-6 max-w-6xl'>
      <div className='flex items-center justify-between mb-6'>
        <Skeleton className='h-8 w-64' />
        <div className='flex space-x-2'>
          <Skeleton className='h-10 w-10' />
          <Skeleton className='h-10 w-10' />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48 mb-2' />
          <Skeleton className='h-4 w-64' />
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Skeleton className='h-6 w-32' />
                <div className='flex space-x-2'>
                  <Skeleton className='h-10 w-10' />
                  <Skeleton className='h-10 w-10' />
                </div>
              </div>

              <div className='grid grid-cols-7 gap-1 text-center'>
                {Array(7)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className='h-10 w-full' />
                  ))}
              </div>

              <div className='space-y-4'>
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className='grid grid-cols-8 gap-1'>
                      <Skeleton className='h-12 w-full' />
                      {Array(7)
                        .fill(0)
                        .map((_, j) => (
                          <Skeleton key={j} className='h-12 w-full' />
                        ))}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
