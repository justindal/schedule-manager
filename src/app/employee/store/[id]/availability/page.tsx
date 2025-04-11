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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export default function AvailabilityPage() {
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
    return availabilities.some((a) => a.date === formattedDate)
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
  }, [storeId])

  if (loading) {
    return <div>Loading availabilities...</div>
  }

  if (error) {
    return <div className='text-red-500'>Error: {error}</div>
  }

  async function fetchAvailability() {
    try {
      if (!user) {
        setError('No authenticated user found')
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

    if (isDateAlreadySet(selectedDate)) {
      setError(
        'Availability already set for this date. Please delete existing availability first.'
      )
      return
    }

    if (startTime && endTime && !isValidTimeRange(startTime, endTime)) {
      setError('End time must be after start time')
      return
    }

    try {
      setLoading(true)
      const { error: saveError } = await supabase.from('availability').insert({
        store_id: storeId,
        user_id: user.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: startTime || null,
        end_time: endTime || null,
        status:
          startTime && endTime
            ? AvailabilityStatus.Available
            : AvailabilityStatus.Unavailable,
      })

      if (saveError) {
        setError(saveError.message)
        return
      }

      await fetchAvailability()
      setSelectedDate(new Date())
      setStartTime('09:00')
      setEndTime('17:00')
      setOpen(false)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to save availability'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <h1 className='text-2xl font-semibold mb-6 text-center sm:text-left'>
        My Availability
      </h1>

      <div className='bg-card rounded-md p-4 border'>
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

      <Card>
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
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Start Time</Label>
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

                      if (isDateAlreadySet(selectedDate)) {
                        alert(
                          'Availability already set for this date. Please delete existing availability first.'
                        )
                        return
                      }

                      try {
                        setLoading(true)
                        const { error } = await supabase
                          .from('availability')
                          .insert({
                            store_id: storeId,
                            user_id: user.id,
                            date: format(selectedDate, 'yyyy-MM-dd'),
                            status: AvailabilityStatus.Unavailable,
                          })

                        if (error) throw error

                        await fetchAvailability()
                        setSelectedDate(new Date())
                        setStartTime('09:00')
                        setEndTime('17:00')
                        setOpen(false)
                      } catch (error) {
                        console.error('Error saving availability:', error)
                        alert('Failed to save availability')
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

      <div className='space-y-4'>
        {availabilities.length === 0 ? (
          <div className='text-center p-8 border rounded-lg bg-gray-50'>
            <p className='text-muted-foreground'>No availabilities set yet.</p>
            <p className='text-sm text-muted-foreground'>
              Click &apos;Set Availability&apos; to add your availability.
            </p>
          </div>
        ) : (
          availabilities.map((availability) => (
            <div
              key={availability.id}
              className={`p-4 rounded-lg border flex items-center justify-between ${
                availability.status === AvailabilityStatus.Unavailable
                  ? 'bg-gray-50'
                  : ''
              }`}
            >
              <div>
                <p className='font-medium'>
                  {format(parseISO(availability.date), 'MMM dd, yyyy')}
                </p>
                {availability.start_time ? (
                  <p className='text-sm text-muted-foreground'>
                    {availability.start_time} - {availability.end_time}
                  </p>
                ) : (
                  <p className='text-sm text-red-500'>Unavailable</p>
                )}
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={async () => {
                  try {
                    const { error } = await supabase
                      .from('availability')
                      .delete()
                      .eq('id', availability.id)

                    if (error) throw error

                    await fetchAvailability()
                  } catch (error) {
                    console.error('Error deleting availability:', error)
                    alert('Failed to delete availability')
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
