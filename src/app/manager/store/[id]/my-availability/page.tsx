'use client'

import { createClientBrowser } from '@/app/utils/supabase/client'
import React, { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { useParams } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, parseISO, addDays, subDays } from 'date-fns'
import { PlusCircle, Trash, ChevronLeft, ChevronRight } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

enum AvailabilityStatus {
  Available = 'available',
  Unavailable = 'unavailable',
}

interface Availability {
  id: string
  date: string
  start_time?: string
  end_time?: string
  user_id: string
  store_id: string
  status: string
}

export default function ManagerAvailabilityPage() {
  const params = useParams()
  const storeId = params.id as string
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientBrowser()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [status, setStatus] = useState<AvailabilityStatus>(
    AvailabilityStatus.Available
  )
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [managerStatus, setManagerStatus] = useState<string | null>(null)
  const [viewOnly, setViewOnly] = useState(false)
  const { toast } = useToast()

  const prevDate = () => setSelectedDate((prev) => subDays(prev, 1))
  const nextDate = () => setSelectedDate((prev) => addDays(prev, 1))

  const isValidTimeRange = (start: string, end: string) => {
    if (!start || !end) return false
    const [startHour, startMinute] = start.split(':').map(Number)
    const [endHour, endMinute] = end.split(':').map(Number)

    const startDate = new Date(2000, 0, 1, startHour, startMinute)
    const endDate = new Date(2000, 0, 1, endHour, endMinute)

    return endDate > startDate
  }

  const isDateAlreadySet = (selectedDate: Date) => {
    const formattedDate = format(selectedDate, 'yyyy-MM-dd')
    return availabilities.find((a) => a.date === formattedDate)
  }

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setUser(data.user)

        if (!data.user) {
          setError('No authenticated user found')
          return
        }

        const { data: managerData } = await supabase
          .from('store_managers')
          .select('status')
          .eq('store_id', storeId)
          .eq('manager_id', data.user.id)
          .maybeSingle()

        setManagerStatus(managerData?.status || null)
        setViewOnly(managerData?.status !== 'approved')

        const { data: availabilityData, error: availabilityError } =
          await supabase
            .from('availability')
            .select('*')
            .eq('store_id', storeId)
            .eq('user_id', data.user.id)
            .order('date', { ascending: true })

        if (availabilityError) {
          setError(availabilityError.message)
          return
        }

        setAvailabilities(availabilityData || [])
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to fetch user data'
        )
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [storeId, supabase])

  useEffect(() => {
    const existingAvailability = isDateAlreadySet(selectedDate)

    if (existingAvailability) {
      if (
        existingAvailability.status === 'available' &&
        existingAvailability.start_time &&
        existingAvailability.end_time
      ) {
        setStartTime(existingAvailability.start_time.slice(0, 5))
        setEndTime(existingAvailability.end_time.slice(0, 5))
      }
    } else {
      setStartTime('09:00')
      setEndTime('17:00')
    }
  }, [selectedDate])

  if (loading) {
    return <AvailabilitySkeleton />
  }

  if (error) {
    return <div className='text-red-500'>Error: {error}</div>
  }

  async function fetchAvailability() {
    try {
      if (!user) {
        const { data } = await supabase.auth.getUser()
        if (!data.user) {
          setError('No authenticated user found')
          return
        }
        setUser(data.user)

        const { data: availData, error: fetchError } = await supabase
          .from('availability')
          .select('*')
          .eq('store_id', storeId)
          .eq('user_id', data.user.id)
          .order('date', { ascending: true })

        if (fetchError) {
          setError(fetchError.message)
          return
        }

        setAvailabilities(availData || [])
        return
      }

      const { data, error: fetchError } = await supabase
        .from('availability')
        .select('*')
        .eq('store_id', storeId)
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setAvailabilities(data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      setError('You must be logged in to set availability')
      return
    }

    if (startTime && endTime && !isValidTimeRange(startTime, endTime)) {
      setError('End time must be after start time')
      return
    }

    try {
      setLoading(true)

      const formattedDate = format(selectedDate, 'yyyy-MM-dd')
      const existingAvailability = isDateAlreadySet(selectedDate)
      const isUpdate = !!existingAvailability

      if (existingAvailability) {
        const { error: updateError } = await supabase
          .from('availability')
          .update({
            start_time: startTime || null,
            end_time: endTime || null,
            status:
              startTime && endTime
                ? AvailabilityStatus.Available
                : AvailabilityStatus.Unavailable,
          })
          .eq('id', existingAvailability.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('availability')
          .insert({
            store_id: storeId,
            user_id: user.id,
            date: formattedDate,
            start_time: startTime || null,
            end_time: endTime || null,
            status:
              startTime && endTime
                ? AvailabilityStatus.Available
                : AvailabilityStatus.Unavailable,
          })

        if (insertError) throw insertError
      }

      await fetchAvailability()
      setSelectedDate(new Date())
      setStartTime('09:00')
      setEndTime('17:00')
      setOpen(false)

      toast({
        title: isUpdate ? 'Availability updated' : 'Availability set',
        description: `Your availability for ${format(
          selectedDate,
          'EEEE, MMMM d'
        )} has been ${isUpdate ? 'updated' : 'set'}.`,
      })
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to save availability'
      )

      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save availability',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-6 max-w-4xl'>
      {managerStatus && managerStatus !== 'approved' && (
        <Card className='bg-amber-50 border-amber-200 mb-4'>
          <CardContent className='p-4'>
            <div className='flex items-center'>
              <AlertCircle className='h-5 w-5 text-amber-600 mr-2' />
              <div>
                <h3 className='font-medium text-amber-800'>Limited Access</h3>
                <p className='text-sm text-amber-700'>
                  Your manager request is {managerStatus}. You can view and set
                  your own availability, but cannot perform other manager
                  actions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <h1 className='text-2xl font-semibold mb-6 text-center sm:text-left'>
        My Availability
      </h1>

      <div className='bg-card rounded-md p-4 border mb-6'>
        <div className='flex items-center justify-center gap-3'>
          <Button
            onClick={prevDate}
            variant='outline'
            size='icon'
            className='h-8 w-8'
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>

          <div className='font-medium text-center px-4 py-2 bg-muted rounded-md'>
            <div className='hidden sm:block'>
              {format(selectedDate, 'MMMM d, yyyy')}
            </div>
            <div className='sm:hidden'>
              {format(selectedDate, 'MMM d, yyyy')}
            </div>
          </div>

          <Button
            onClick={nextDate}
            variant='outline'
            size='icon'
            className='h-8 w-8'
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <Card className='mb-8'>
        <CardHeader className='py-4'>
          <CardTitle>Set Availability</CardTitle>
          <CardDescription>
            Set your availability for the selected date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant='outline' size='sm'>
                <PlusCircle className='h-4 w-4 mr-2' />
                Set Availability
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Your Availability</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Select Date</Label>
                  <div className='flex justify-center'>
                    <Calendar
                      mode='single'
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className='rounded-md border'
                      modifiers={{
                        booked: (date) => !!isDateAlreadySet(date),
                      }}
                      modifiersClassNames={{
                        booked: 'border-2 border-blue-400 bg-blue-50',
                      }}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Start Time</Label>
                  {isDateAlreadySet(selectedDate) && (
                    <div className='mb-1'>
                      <Badge variant='outline' className='text-xs bg-blue-50'>
                        Updating existing availability
                      </Badge>
                    </div>
                  )}
                  <Input
                    type='time'
                    value={startTime}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
                        setStartTime(value)
                      }
                    }}
                    step='900'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>End Time</Label>
                  <Input
                    type='time'
                    value={endTime}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
                        setEndTime(value)
                      }
                    }}
                    step='900'
                  />
                </div>

                <div className='flex gap-2'>
                  <Button
                    type='submit'
                    className='flex-1'
                    disabled={loading || !selectedDate}
                  >
                    {loading ? 'Saving...' : 'Set Available'}
                  </Button>
                  <Button
                    type='button'
                    variant='destructive'
                    className='flex-1'
                    disabled={loading || !selectedDate}
                    onClick={async () => {
                      if (!selectedDate || !user) return

                      try {
                        setLoading(true)
                        const formattedDate = format(selectedDate, 'yyyy-MM-dd')
                        const existingAvailability =
                          isDateAlreadySet(selectedDate)
                        const isUpdate = !!existingAvailability

                        if (existingAvailability) {
                          const { error } = await supabase
                            .from('availability')
                            .update({
                              start_time: null,
                              end_time: null,
                              status: AvailabilityStatus.Unavailable,
                            })
                            .eq('id', existingAvailability.id)

                          if (error) throw error
                        } else {
                          const { error } = await supabase
                            .from('availability')
                            .insert({
                              store_id: storeId,
                              user_id: user.id,
                              date: formattedDate,
                              status: AvailabilityStatus.Unavailable,
                            })

                          if (error) throw error
                        }

                        await fetchAvailability()
                        setSelectedDate(new Date())
                        setStartTime('09:00')
                        setEndTime('17:00')
                        setOpen(false)

                        toast({
                          title: isUpdate
                            ? 'Availability updated'
                            : 'Availability set',
                          description: `You are marked as unavailable for ${format(
                            selectedDate,
                            'EEEE, MMMM d'
                          )}.`,
                        })
                      } catch (error) {
                        console.error('Error saving availability:', error)

                        toast({
                          variant: 'destructive',
                          title: 'Error',
                          description: 'Failed to save availability',
                        })
                      } finally {
                        setLoading(false)
                      }
                    }}
                  >
                    Set Unavailable
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <h2 className='text-lg font-medium mb-4'>Your Availability</h2>
      <div className='space-y-5'>
        {availabilities.length === 0 ? (
          <div className='text-center p-8 border rounded-lg bg-gray-50'>
            <p className='text-muted-foreground'>No availabilities set yet.</p>
            <p className='text-sm text-muted-foreground mt-1'>
              Click &apos;Set Availability&apos; to add your availability.
            </p>
          </div>
        ) : (
          availabilities.map((availability) => (
            <div
              key={availability.id}
              className={`p-5 rounded-lg border shadow-sm flex items-center justify-between ${
                availability.status === AvailabilityStatus.Unavailable
                  ? 'bg-gray-50'
                  : ''
              }`}
            >
              <div>
                <p className='font-medium text-base'>
                  {format(parseISO(availability.date), 'EEE, MMM dd, yyyy')}
                </p>
                {availability.start_time ? (
                  <p className='text-sm text-muted-foreground mt-1'>
                    {format(
                      new Date(`2000-01-01T${availability.start_time}`),
                      'h:mm a'
                    )}{' '}
                    -{' '}
                    {format(
                      new Date(`2000-01-01T${availability.end_time}`),
                      'h:mm a'
                    )}
                  </p>
                ) : (
                  <p className='text-sm text-red-500 mt-1 font-medium'>
                    Unavailable
                  </p>
                )}
              </div>
              <Button
                variant='ghost'
                size='sm'
                className='hover:bg-red-50 hover:text-red-600'
                onClick={async () => {
                  try {
                    const { error } = await supabase
                      .from('availability')
                      .delete()
                      .eq('id', availability.id)

                    if (error) throw error

                    await fetchAvailability()

                    toast({
                      title: 'Availability deleted',
                      description: `Availability for ${format(
                        parseISO(availability.date),
                        'EEEE, MMMM d'
                      )} has been deleted.`,
                    })
                  } catch (error) {
                    console.error('Error deleting availability:', error)

                    toast({
                      variant: 'destructive',
                      title: 'Error',
                      description: 'Failed to delete availability',
                    })
                  }
                }}
              >
                <Trash className='h-4 w-4' />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AvailabilitySkeleton() {
  return (
    <div className='container mx-auto px-4 py-6 max-w-4xl'>
      <div className='flex items-center justify-between mb-6'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-10 w-32' />
      </div>

      <div className='space-y-6'>
        <Card className='shadow-sm'>
          <CardHeader>
            <Skeleton className='h-6 w-40 mb-2' />
            <Skeleton className='h-4 w-64' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Skeleton className='h-8 w-full mb-2' />
                  <Skeleton className='h-60 w-full' />
                </div>
                <div className='space-y-4'>
                  <Skeleton className='h-5 w-full' />
                  {[1, 2, 3].map((i) => (
                    <div key={i} className='flex items-center gap-2'>
                      <Skeleton className='h-5 w-5' />
                      <Skeleton className='h-5 w-32' />
                    </div>
                  ))}
                  <div className='pt-4 flex gap-2'>
                    <Skeleton className='h-10 w-32' />
                    <Skeleton className='h-10 w-32' />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-48' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='p-3 border rounded-md'>
                  <div className='flex justify-between mb-2'>
                    <Skeleton className='h-5 w-24' />
                    <Skeleton className='h-5 w-20' />
                  </div>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className='h-8 w-full' />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
