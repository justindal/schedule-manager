'use client'

import { useParams } from 'next/navigation'
import { createClientBrowser } from '@/app/utils/supabase/client'
import { useState, useEffect, useMemo } from 'react'
import {
  format,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  parseISO,
  isSameDay,
} from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Check, Clock, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface AvailabilityData {
  id: string
  user_id: string
  store_id: string
  date: string
  status: 'available' | 'unavailable'
  start_time?: string
  end_time?: string
}

function AvailabilitySkeleton() {
  return (
    <div className='container mx-auto px-4 py-6 max-w-6xl'>
      <div className='flex items-center justify-between mb-6'>
        <Skeleton className='h-8 w-64' />
        <div className='flex space-x-2'>
          <Skeleton className='h-10 w-10' />
          <Skeleton className='h-10 w-10' />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className='h-48 w-full' />
          ))}
      </div>
    </div>
  )
}

export default function MyAvailabilityPage() {
  const params = useParams()
  const storeId = params.id as string
  const supabase = createClientBrowser()
  const [loading, setLoading] = useState(true)
  const [storeName, setStoreName] = useState('')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [availabilities, setAvailabilities] = useState<AvailabilityData[]>([])
  const [editingDay, setEditingDay] = useState<Date | null>(null)
  const [editingAvailability, setEditingAvailability] =
    useState<AvailabilityData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEmployee, setIsEmployee] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const weekDates = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(currentWeek),
        end: endOfWeek(currentWeek),
      }),
    [currentWeek]
  )

  useEffect(() => {
    async function checkUserRoleAndLoadData() {
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          toast({
            title: 'Authentication Error',
            description: 'You must be logged in to view this page',
            variant: 'destructive',
          })
          return
        }

        setCurrentUserId(userData.user.id)

        const { data: storeData } = await supabase
          .from('stores')
          .select('name')
          .eq('id', storeId)
          .single()

        if (storeData) {
          setStoreName(storeData.name)
        }

        const { data: managerData } = await supabase
          .from('store_managers')
          .select('*')
          .eq('store_id', storeId)
          .eq('manager_id', userData.user.id)
          .maybeSingle()

        setIsManager(!!managerData)

        const { data: employeeData } = await supabase
          .from('store_employees')
          .select('*')
          .eq('store_id', storeId)
          .eq('employee_id', userData.user.id)
          .maybeSingle()

        setIsEmployee(!!employeeData)

        if (employeeData || managerData) {
          const { data: availabilityData } = await supabase
            .from('availability')
            .select('*')
            .eq('store_id', storeId)
            .eq('user_id', userData.user.id)
            .gte('date', format(weekDates[0], 'yyyy-MM-dd'))
            .lte('date', format(weekDates[6], 'yyyy-MM-dd'))

          setAvailabilities(availabilityData || [])
        } else {
          toast({
            title: 'Access Denied',
            description: "You don't have access to this store",
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        toast({
          title: 'Error',
          description: 'Failed to load availability data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    checkUserRoleAndLoadData()
  }, [storeId, supabase, weekDates])

  function getAvailabilityForDate(date: Date) {
    return availabilities.find((a) => isSameDay(parseISO(a.date), date))
  }

  async function handleSetAvailability(
    date: Date,
    status: 'available' | 'unavailable',
    startTime?: string,
    endTime?: string
  ) {
    if (!currentUserId) return

    setIsSubmitting(true)
    try {
      const dateString = format(date, 'yyyy-MM-dd')
      const existingAvailability = getAvailabilityForDate(date)

      if (existingAvailability) {
        const { error } = await supabase
          .from('availability')
          .update({
            status,
            start_time: status === 'available' ? startTime : null,
            end_time: status === 'available' ? endTime : null,
          })
          .eq('id', existingAvailability.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('availability').insert({
          user_id: currentUserId,
          store_id: storeId,
          date: dateString,
          status,
          start_time: status === 'available' ? startTime : null,
          end_time: status === 'available' ? endTime : null,
        })

        if (error) throw error
      }

      const { data } = await supabase
        .from('availability')
        .select('*')
        .eq('store_id', storeId)
        .eq('user_id', currentUserId)
        .gte('date', format(weekDates[0], 'yyyy-MM-dd'))
        .lte('date', format(weekDates[6], 'yyyy-MM-dd'))

      setAvailabilities(data || [])
      setEditingDay(null)
      setEditingAvailability(null)

      toast({
        title: 'Availability Updated',
        description: `Your availability for ${format(
          date,
          'EEEE, MMMM d'
        )} has been updated.`,
      })
    } catch (error) {
      console.error('Error updating availability:', error)
      toast({
        title: 'Error',
        description: 'Failed to update availability. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleEdit(date: Date) {
    const availability = getAvailabilityForDate(date)
    setEditingDay(date)
    setEditingAvailability(availability || null)
  }

  function handleAvailabilitySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingDay) return

    const formData = new FormData(e.currentTarget)
    const status = formData.get('status') as 'available' | 'unavailable'

    if (status === 'available') {
      const startTime = formData.get('startTime') as string
      const endTime = formData.get('endTime') as string
      handleSetAvailability(editingDay, status, startTime, endTime)
    } else {
      handleSetAvailability(editingDay, status)
    }
  }

  if (loading) {
    return <AvailabilitySkeleton />
  }

  if (!isManager && !isEmployee) {
    return (
      <div className='container mx-auto px-4 py-6 max-w-6xl'>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have access to set availability for this store.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
        <h1 className='text-2xl font-semibold'>
          {storeName}{' '}
          <span className='text-muted-foreground font-normal'>
            My Availability
          </span>
        </h1>
      </div>

      <div className='bg-card rounded-md p-4 border'>
        <div className='flex items-center justify-center gap-3'>
          <Button
            onClick={() => setCurrentWeek((prev) => subWeeks(prev, 1))}
            variant='outline'
            size='icon'
            className='h-8 w-8'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          <div className='font-medium text-center px-4 py-2 bg-muted rounded-md'>
            <div className='hidden sm:block'>
              {format(weekDates[0], 'MMMM d')} -{' '}
              {format(weekDates[6], 'MMMM d, yyyy')}
            </div>
            <div className='sm:hidden'>
              {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d')}
            </div>
          </div>

          <Button
            onClick={() => setCurrentWeek((prev) => addWeeks(prev, 1))}
            variant='outline'
            size='icon'
            className='h-8 w-8'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {weekDates.map((date) => {
          const availability = getAvailabilityForDate(date)
          return (
            <Card key={date.toISOString()} className='relative'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-lg'>
                  {format(date, 'EEEE')}
                </CardTitle>
                <CardDescription className='text-sm'>
                  {format(date, 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availability ? (
                  <div className='space-y-2'>
                    {availability.status === 'available' ? (
                      <>
                        <div className='flex items-center'>
                          <Badge className='bg-green-500'>Available</Badge>
                        </div>
                        {availability.start_time && availability.end_time && (
                          <div className='flex items-center text-sm text-muted-foreground'>
                            <Clock className='h-4 w-4 mr-2' />
                            <span>
                              {availability.start_time.slice(0, 5)} -{' '}
                              {availability.end_time.slice(0, 5)}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className='flex items-center'>
                        <Badge
                          variant='outline'
                          className='border-red-200 text-red-600'
                        >
                          Unavailable
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='text-sm text-muted-foreground'>
                    No availability set
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => handleEdit(date)}
                >
                  {availability ? 'Edit' : 'Set'} Availability
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Dialog
        open={editingDay !== null}
        onOpenChange={(open) => !open && setEditingDay(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Set Availability for{' '}
              {editingDay && format(editingDay, 'EEEE, MMMM d')}
            </DialogTitle>
            <DialogDescription>
              Indicate whether you are available to work on this day
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAvailabilitySubmit}>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='status'>Availability Status</Label>
                <Select
                  name='status'
                  defaultValue={editingAvailability?.status || 'available'}
                  onValueChange={(value) => {
                    setEditingAvailability((prev) =>
                      prev
                        ? {
                            ...prev,
                            status: value as 'available' | 'unavailable',
                          }
                        : {
                            id: '',
                            user_id: '',
                            store_id: '',
                            date: '',
                            status: value as 'available' | 'unavailable',
                          }
                    )
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select your availability' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='available'>Available</SelectItem>
                    <SelectItem value='unavailable'>Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(editingAvailability?.status === 'available' ||
                (!editingAvailability && editingDay)) && (
                <div className='grid grid-cols-2 gap-4 pt-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='startTime'>Start Time</Label>
                    <Input
                      id='startTime'
                      name='startTime'
                      type='time'
                      step='300'
                      defaultValue={
                        editingAvailability?.start_time?.slice(0, 5) || '09:00'
                      }
                      className='w-full'
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='endTime'>End Time</Label>
                    <Input
                      id='endTime'
                      name='endTime'
                      type='time'
                      step='300'
                      defaultValue={
                        editingAvailability?.end_time?.slice(0, 5) || '17:00'
                      }
                      className='w-full'
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className='mt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setEditingDay(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Availability'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
