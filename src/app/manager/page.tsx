import { createClient } from '@/app/utils/supabase/server'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Clock, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { UnifiedStoreCard } from './UnifiedStoreCard'
import { headers } from 'next/headers'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { JoinStoreDialog } from './JoinStoreDialog'

export default async function ManagerDashboard() {
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

  const allUserStores = [...managerStores]

  const { data: employeeData } = await supabase
    .from('store_employees')
    .select(`store_id`)
    .eq('employee_id', user?.id)

  const employeeStoreIds = new Set(
    employeeData?.map((item) => item.store_id) || []
  )

  if (!allUserStores?.length && !employeeData?.length) {
    return (
      <div className='container mx-auto px-4 py-8 space-y-6'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0'>
          <h1 className='text-2xl font-semibold'>My Stores</h1>
          <div className='flex flex-wrap gap-2'>
            <JoinStoreDialog
              trigger={<Button className='w-full sm:w-auto'>Join Store</Button>}
            />
            <Button asChild className='w-full sm:w-auto'>
              <Link href='/manager/stores/new'>
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

  const storesWithUserInfo = stores.map((store) => {
    const managerStore = managerStores.find((ms) => ms.store_id === store.id)
    return {
      ...store,
      isManager: !!managerStore,
      managerStatus: managerStore?.status,
      isEmployee: employeeStoreIds.has(store.id),
    }
  })

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0'>
        <h1 className='text-2xl font-semibold'>My Stores</h1>
        <div className='flex flex-wrap gap-2'>
          <JoinStoreDialog
            trigger={<Button className='w-full sm:w-auto'>Join Store</Button>}
          />
          <Button asChild className='w-full sm:w-auto'>
            <Link href='/manager/stores/new'>
              <Plus className='w-4 h-4 mr-2' />
              Create Store
            </Link>
          </Button>
        </div>
      </div>

      <div className='grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
        {storesWithUserInfo.map((store) => (
          <UnifiedStoreCard
            key={store.id}
            store={store}
            isManager={store.isManager}
            isEmployee={store.isEmployee}
            managerStatus={store.managerStatus}
          />
        ))}
      </div>
    </div>
  )
}
