import { createClient } from '@/app/utils/supabase/server'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { JoinStoreDialog } from './JoinStoreDialog'
import { StoreListTabs } from './StoreListTabs'

export default async function DashboardPage() {
  // @ts-expect-error - Next.js headers helper
  headers({ 'Cache-Control': 'no-store' })

  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  const { data: managerStores, error: managerError } = await supabase
    .from('store_managers')
    .select('store_id, is_primary, status')
    .eq('manager_id', user?.id)

  if (managerError) {
    console.error('Error fetching manager stores:', managerError)
    return <div>Error loading stores</div>
  }

  const { data: employeeData } = await supabase
    .from('store_employees')
    .select(`store_id`)
    .eq('employee_id', user?.id)

  if (!managerStores?.length && !employeeData?.length) {
    return (
      <div className='container mx-auto px-4 py-8 space-y-6'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0'>
          <h1 className='text-2xl font-semibold'>My Stores</h1>
          <div className='flex flex-col w-full gap-4 mt-6 mb-8 sm:mt-0 sm:mb-0 sm:flex-row sm:w-auto sm:flex-wrap sm:gap-2 sm:ml-auto'>
            <JoinStoreDialog
              trigger={
                <Button className='w-full sm:w-auto px-6 py-3 text-base'>
                  Join Store
                </Button>
              }
            />
            <Button asChild className='w-full sm:w-auto px-6 py-3 text-base'>
              <Link href='/dashboard/stores/new'>
                <Plus className='w-4 h-4 mr-2' />
                Create Store
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Stores Yet</CardTitle>
            <CardDescription>
              Join an existing store or create a new one to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const storeIds = [
    ...new Set([
      ...managerStores.map((ms) => ms.store_id),
      ...(employeeData?.map((ed) => ed.store_id) || []),
    ]),
  ]

  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*')
    .in('id', storeIds)
    .order('name')

  if (storesError) {
    console.error('Error fetching stores:', storesError)
    return <div>Error loading stores</div>
  }

  const allStores = stores.map((store) => {
    const managerStore = managerStores.find((ms) => ms.store_id === store.id)
    const isManager = !!managerStore
    const isEmployee =
      employeeData?.some((ed) => ed.store_id === store.id) || false

    return {
      ...store,
      isManager,
      managerStatus: managerStore?.status,
      isEmployee,
    }
  })

  const managedStores = allStores.filter((store) => store.isManager)
  const employeeOnlyStores = allStores.filter(
    (store) => store.isEmployee && !store.isManager
  )

  return (
    <div className='container mx-auto px-4 py-8 space-y-8'>
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0'>
        <h1 className='text-2xl font-semibold'>My Stores</h1>
        <div className='flex flex-col w-full gap-4 mt-6 mb-8 sm:mt-0 sm:mb-0 sm:flex-row sm:w-auto sm:flex-wrap sm:gap-2 sm:ml-auto'>
          <JoinStoreDialog
            trigger={
              <Button className='w-full sm:w-auto px-6 py-3 text-base'>
                Join Store
              </Button>
            }
          />
          <Button asChild className='w-full sm:w-auto px-6 py-3 text-base'>
            <Link href='/dashboard/stores/new'>
              <Plus className='w-4 h-4 mr-2' />
              Create Store
            </Link>
          </Button>
        </div>
      </div>

      <StoreListTabs
        allStores={allStores}
        managedStores={managedStores}
        employeeStores={employeeOnlyStores}
      />
    </div>
  )
}
