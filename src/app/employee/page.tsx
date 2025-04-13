import { createClient } from '@/app/utils/supabase/server'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { StoreCard } from './components/StoreCard'
import { headers } from 'next/headers'

interface Store {
  id: string
  name: string
  address: string
}

interface StoreEmployee {
  stores: Store
}

export default async function EmployeeDashboard() {
  // @ts-expect-error - Next.js headers helper
  headers({ 'Cache-Control': 'no-store' })

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
    <div className='container mx-auto px-3 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0'>
        <h1 className='text-xl sm:text-3xl font-bold'>My Dashboard</h1>
        <Button asChild className='w-full sm:w-auto text-sm' size='sm'>
          <Link href='/employee/join'>
            <Plus className='h-4 w-4 mr-2' />
            Join Store
          </Link>
        </Button>
      </div>

      <Card className='shadow-sm'>
        <CardHeader className='px-4 py-3 sm:py-4'>
          <CardTitle className='text-lg sm:text-xl'>My Stores</CardTitle>
          <CardDescription>
            Stores you&apos;re currently working at
          </CardDescription>
        </CardHeader>
        <CardContent className='px-4 py-2 sm:py-4'>
          <div className='space-y-3 sm:space-y-4'>
            {stores?.length === 0 ? (
              <div className='text-center py-6 text-muted-foreground text-sm'>
                You haven&apos;t joined any stores yet. Click the &quot;Join
                Store&quot; button above to get started.
              </div>
            ) : (
              stores?.map((record) => (
                <StoreCard key={record.stores.id} store={record.stores} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
