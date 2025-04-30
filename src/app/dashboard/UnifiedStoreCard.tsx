'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Store, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { createClientBrowser } from '@/app/utils/supabase/client'
import { useState } from 'react'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface StoreData {
  id: string
  name: string
  address: string
  phone_number: string
  join_code?: string
  is_primary?: boolean
}

interface Props {
  store: StoreData
  isManager: boolean
  isEmployee: boolean
  managerStatus?: 'approved' | 'pending' | 'rejected'
}

export function UnifiedStoreCard({
  store,
  isManager,
  isEmployee,
  managerStatus,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const router = useRouter()

  async function addSelfAsEmployee() {
    setLoading(true)
    const supabase = createClientBrowser()
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to perform this action',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    try {
      const { data: existingEmployee, error: checkError } = await supabase
        .from('store_employees')
        .select('*')
        .eq('store_id', store.id)
        .eq('employee_id', user.id)
        .single()

      if (checkError && !checkError.message.includes('No rows found')) {
        console.error('Error checking employee status:', checkError)
        toast({
          title: 'Error',
          description: 'Failed to check employee status',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      if (existingEmployee) {
        toast({
          title: 'Already an Employee',
          description: 'You already have employee access to this store',
        })
        setLoading(false)
        return
      }

      const { error } = await supabase.from('store_employees').insert({
        store_id: store.id,
        employee_id: user.id,
      })

      if (error) {
        console.error('Error adding employee access:', error)
        toast({
          title: 'Error',
          description: `Failed to add employee access: ${error.message}`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'You now have employee access to this store',
        })
        router.refresh()
      }
    } catch (error) {
      console.error('Error adding employee access:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function leaveStore() {
    setIsLeaving(true)
    const supabase = createClientBrowser()
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to perform this action',
        variant: 'destructive',
      })
      setIsLeaving(false)
      return
    }

    try {
      if (isManager && store.is_primary) {
        toast({
          title: 'Cannot Leave Store',
          description: 'You are the primary manager of this store',
          variant: 'destructive',
        })
        setIsLeaving(false)
        return
      }

      if (isEmployee) {
        const { error: employeeError } = await supabase
          .from('store_employees')
          .delete()
          .eq('store_id', store.id)
          .eq('employee_id', user.id)

        if (employeeError) throw employeeError
      }

      toast({
        title: 'Left Store',
        description: 'You have successfully left the store',
      })

      setLeaveDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error leaving store:', error)
      toast({
        title: 'Error',
        description: 'Failed to leave the store',
        variant: 'destructive',
      })
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
          <div>
            <CardTitle>{store.name}</CardTitle>
            <div className='flex gap-2 mt-1'>
              {isManager && managerStatus === 'approved' ? (
                <Badge className='bg-blue-500'>Manager</Badge>
              ) : (
                isEmployee && <Badge variant='outline'>Employee</Badge>
              )}
            </div>
          </div>
          {store.join_code && isManager && managerStatus === 'approved' && (
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground'>Join Code:</span>
              <code className='text-sm bg-muted px-2 py-1 rounded-md'>
                {store.join_code}
              </code>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-2 text-sm mb-4'>
          <p className='text-muted-foreground'>{store.address}</p>
          <p className='text-muted-foreground'>{store.phone_number}</p>
        </div>

        {isManager && managerStatus === 'pending' && (
          <div className='mb-4 p-3 border rounded-md bg-yellow-50'>
            <h3 className='text-sm font-medium mb-2'>Access Pending</h3>
            <p className='text-xs text-muted-foreground mb-2'>
              Your request for manager access is pending approval. You currently
              have employee access to this store.
            </p>
          </div>
        )}

        {isManager && managerStatus === 'rejected' && (
          <div className='mb-4 p-3 border rounded-md bg-red-50'>
            <h3 className='text-sm font-medium mb-2'>Request Rejected</h3>
            <p className='text-xs text-muted-foreground mb-2'>
              Your request for manager access was rejected.
            </p>
          </div>
        )}

        {isManager && managerStatus === 'approved' && !isEmployee && (
          <div className='mb-4 p-3 border rounded-md bg-muted/50'>
            <h3 className='text-sm font-medium mb-2'>Add Employee Access</h3>
            <p className='text-xs text-muted-foreground mb-2'>
              You have manager access but not employee access. Add employee
              access to view schedules and set your availability.
            </p>
            <Button
              variant='secondary'
              size='sm'
              className='w-full'
              onClick={addSelfAsEmployee}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Employee Access'}
            </Button>
          </div>
        )}

        <div className='grid grid-cols-2 gap-2'>
          {isManager && managerStatus === 'approved' && (
            <>
              <Button asChild variant='outline' size='sm' className='w-full'>
                <Link href={`/store/${store.id}`}>
                  <Store className='h-4 w-4 mr-2' />
                  Details
                </Link>
              </Button>
              <Button asChild variant='outline' size='sm' className='w-full'>
                <Link href={`/store/${store.id}/availability`}>
                  <Clock className='h-4 w-4 mr-2' />
                  View Availabilities
                </Link>
              </Button>
              <Button asChild variant='outline' size='sm' className='w-full'>
                <Link href={`/store/${store.id}/schedule?manage=true`}>
                  <Calendar className='h-4 w-4 mr-2' />
                  Manage Schedule
                </Link>
              </Button>
              <Button asChild variant='outline' size='sm' className='w-full'>
                <Link href={`/store/${store.id}/my-availability`}>
                  <Clock className='h-4 w-4 mr-2' />
                  My Availability
                </Link>
              </Button>
            </>
          )}

          {isEmployee && !isManager && (
            <>
              <Button asChild variant='outline' size='sm' className='w-full'>
                <Link href={`/store/${store.id}/schedule`}>
                  <Calendar className='h-4 w-4 mr-2' />
                  View Schedule
                </Link>
              </Button>
              <Button asChild variant='outline' size='sm' className='w-full'>
                <Link href={`/store/${store.id}/my-availability`}>
                  <Clock className='h-4 w-4 mr-2' />
                  My Availability
                </Link>
              </Button>
            </>
          )}

          {isEmployee && isManager && managerStatus !== 'approved' && (
            <>
              <Button asChild variant='outline' size='sm' className='w-full'>
                <Link href={`/store/${store.id}/schedule`}>
                  <Calendar className='h-4 w-4 mr-2' />
                  View Schedule
                </Link>
              </Button>
              <Button asChild variant='outline' size='sm' className='w-full'>
                <Link href={`/store/${store.id}/my-availability`}>
                  <Clock className='h-4 w-4 mr-2' />
                  My Availability
                </Link>
              </Button>
            </>
          )}
        </div>

        {isEmployee && !isManager && (
          <div className='mt-4'>
            <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600'
                >
                  <LogOut className='h-4 w-4 mr-2' />
                  Leave Store
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    This will remove you as an employee from {store.name}. You
                    will no longer have access to the store dashboard.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setLeaveDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={leaveStore}
                    disabled={isLeaving}
                  >
                    {isLeaving ? 'Leaving...' : 'Leave Store'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function UnifiedStoreCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
          <div>
            <Skeleton className='h-6 w-48' />
            <div className='flex gap-2 mt-1'>
              <Skeleton className='h-5 w-20' />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-2 text-sm mb-4'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-32' />
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      </CardContent>
    </Card>
  )
}
