import { createClient } from '@/app/utils/supabase/server'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Store, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function ManagerDashboard() {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  const { data: managerStores, error: managerError } = await supabase
    .from('store_managers')
    .select('store_id, is_primary')
    .eq('manager_id', user?.id)

  if (managerError) {
    console.error('Error fetching manager stores:', managerError)
    return <div>Error loading stores</div>
  }

  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*')
    .in(
      'id',
      managerStores.map((ms) => ms.store_id)
    )
    .order('name')

  if (storesError) {
    console.error('Error fetching stores:', storesError)
    return <div>Error loading stores</div>
  }

  const storesWithManagerInfo = stores.map((store) => ({
    ...store,
    is_primary: managerStores.find((ms) => ms.store_id === store.id)
      ?.is_primary,
  }))

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>My Stores</h1>
        <div className='flex gap-2'>
          <Button asChild>
            <Link href='/manager/join'>Join Store</Link>
          </Button>
          <Button asChild>
            <Link href='/stores/new'>
              <Plus className='w-4 h-4 mr-2' />
              Create Store
            </Link>
          </Button>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {storesWithManagerInfo.map((store) => (
          <Card key={store.id}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>{store.name}</CardTitle>
                {store.join_code && (
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-muted-foreground'>
                      Join Code:
                    </span>
                    <code className='text-sm bg-muted px-2 py-1 rounded-md'>
                      {store.join_code}
                    </code>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <p className='text-muted-foreground'>{store.address}</p>
                <p className='text-muted-foreground'>{store.phone_number}</p>
                <div className='pt-4 flex flex-wrap gap-2'>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/manager/store/${store.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/manager/store/${store.id}/availability`}>
                      View Availabilities
                    </Link>
                  </Button>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/manager/store/${store.id}/my-availability`}>
                      My Availability
                    </Link>
                  </Button>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/manager/store/${store.id}/schedule`}>
                      <Calendar className='h-4 w-4 mr-2' />
                      Schedule
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
