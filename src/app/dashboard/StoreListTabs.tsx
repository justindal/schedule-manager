'use client'

import { UnifiedStoreCard } from './UnifiedStoreCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Briefcase, User } from 'lucide-react'
import { useState } from 'react'

interface Store {
  id: string
  name: string
  address: string
  phone_number: string
  join_code?: string
  is_primary?: boolean
  isManager: boolean
  isEmployee: boolean
  managerStatus?: 'approved' | 'pending' | 'rejected'
}

interface StoreListTabsProps {
  allStores: Store[]
  managedStores: Store[]
  employeeStores: Store[]
}

export function StoreListTabs({
  allStores,
  managedStores,
  employeeStores,
}: StoreListTabsProps) {
  const sortedAllStores = [
    ...allStores.filter((store) => store.isManager),
    ...allStores.filter((store) => !store.isManager && store.isEmployee),
    ...allStores.filter((store) => !store.isManager && !store.isEmployee),
  ]

  return (
    <Tabs defaultValue='all' className='w-full'>
      <TabsList className='mb-6'>
        <TabsTrigger value='all' className='flex items-center gap-1'>
          <Briefcase className='h-4 w-4' />
          <span>All Stores</span>
          <span className='ml-1 text-xs rounded-full bg-muted px-2 py-0.5'>
            {allStores.length}
          </span>
        </TabsTrigger>
        {managedStores.length > 0 && (
          <TabsTrigger value='managed' className='flex items-center gap-1'>
            <Briefcase className='h-4 w-4' />
            <span>Managed</span>
            <span className='ml-1 text-xs rounded-full bg-muted px-2 py-0.5'>
              {managedStores.length}
            </span>
          </TabsTrigger>
        )}
        {employeeStores.length > 0 && (
          <TabsTrigger value='employee' className='flex items-center gap-1'>
            <User className='h-4 w-4' />
            <span>Staff</span>
            <span className='ml-1 text-xs rounded-full bg-muted px-2 py-0.5'>
              {employeeStores.length}
            </span>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value='all' className='m-0'>
        <div className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
          {sortedAllStores.map((store) => (
            <UnifiedStoreCard
              key={store.id}
              store={store}
              isManager={store.isManager}
              isEmployee={store.isEmployee}
              managerStatus={store.managerStatus}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value='managed' className='m-0'>
        <div className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
          {managedStores.map((store) => (
            <UnifiedStoreCard
              key={store.id}
              store={store}
              isManager={store.isManager}
              isEmployee={store.isEmployee}
              managerStatus={store.managerStatus}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value='employee' className='m-0'>
        <div className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
          {employeeStores.map((store) => (
            <UnifiedStoreCard
              key={store.id}
              store={store}
              isManager={store.isManager}
              isEmployee={store.isEmployee}
              managerStatus={store.managerStatus}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
