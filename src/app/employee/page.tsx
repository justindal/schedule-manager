import { createClient } from '@/app/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

interface Store {
  id: string
  name: string
  address: string
}

interface StoreEmployee {
  stores: Store
}

export default async function EmployeeDashboard() {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  const { data: stores } = (await supabase
    .from('store_employees')
    .select(
      `
      stores (
        id,
        name,
        address
      )
    `
    )
    .eq('employee_id', user?.id)) as unknown as { data: StoreEmployee[] }

  return (
    <div className='container mx-auto py-8 space-y-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>My Dashboard</h1>
        <Button asChild>
          <Link href='/employee/join'>Join Store</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Stores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {stores?.map((record: StoreEmployee) => (
              <div
                key={record.stores.id}
                className='flex justify-between items-center p-4 border rounded-lg'
              >
                <div className='space-y-1'>
                  <div className='font-medium'>{record.stores.name}</div>
                  <div className='text-sm text-muted-foreground'>
                    {record.stores.address}
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <Link href={`/manager/store/${record.stores.id}/schedule`}>
                      <Calendar className='h-4 w-4 mr-2' />
                      Schedule
                    </Link>
                  </Button>
                  <Button variant='outline' size='sm' asChild>
                    <Link
                      href={`/employee/store/${record.stores.id}/availability`}
                    >
                      <Clock className='h-4 w-4 mr-2' />
                      Availability
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
