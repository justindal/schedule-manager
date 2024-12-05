'use client'

import { createClient } from '@/app/utils/supabase/client'
import React, { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, parseISO, addDays } from 'date-fns'
import { PlusCircle, Trash } from 'lucide-react'

enum AvailabilityStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  PENDING = 'pending',
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

interface PageParams {
  id: string
}

export default function StoreAvailability({
  params,
}: {
  params: Promise<PageParams>
}) {
  const unwrappedParams = React.use(params)
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState<Date>()
  const [startTime, setStartTime] = useState<string>('03:00')
  const [endTime, setEndTime] = useState<string>('03:00')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

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
    async function init() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError) throw userError

        if (!user) {
          setFetchError('No authenticated user found')
          return
        }

        setUser(user)

        const { data, error: availError } = await supabase
          .from('availability')
          .select('*')
          .eq('store_id', unwrappedParams.id)
          .eq('user_id', user.id)
          .order('date', { ascending: true })

        if (availError) throw availError

        console.log('Fetched availabilities:', data)
        setAvailabilities(data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        setFetchError(
          error instanceof Error ? error.message : 'Failed to fetch data'
        )
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [unwrappedParams.id])

  if (isLoading) {
    return <div>Loading availabilities...</div>
  }

  if (fetchError) {
    return <div className='text-red-500'>Error: {fetchError}</div>
  }

  async function fetchAvailability() {
    try {
      if (!user) {
        setFetchError('No authenticated user found')
        return
      }

      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('store_id', unwrappedParams.id)
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (error) throw error

      setAvailabilities(data || [])
    } catch (error) {
      console.error('Error fetching availabilities:', error)
      setFetchError(
        error instanceof Error ? error.message : 'Failed to fetch data'
      )
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user) {
      alert('You must be logged in to set availability')
      return
    }

    if (!date) {
      alert('Please select a date')
      return
    }

    if (isDateAlreadySet(date)) {
      alert(
        'Availability already set for this date. Please delete existing availability first.'
      )
      return
    }

    if (startTime && endTime && !isValidTimeRange(startTime, endTime)) {
      alert('End time must be after start time')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.from('availability').insert({
        store_id: unwrappedParams.id,
        user_id: user.id,
        date: format(date, 'yyyy-MM-dd'),
        start_time: startTime || null,
        end_time: endTime || null,
        status:
          startTime && endTime
            ? AvailabilityStatus.AVAILABLE
            : AvailabilityStatus.UNAVAILABLE,
      })

      if (error) {
        throw error
      }

      await fetchAvailability()
      setDate(undefined)
      setStartTime('')
      setEndTime('')
      setOpen(false)
    } catch (error) {
      console.error('Error saving availability:', error)
      alert('Failed to save availability')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='mt-8 px-4 sm:px-6 lg:px-8'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold'>Availability</h3>
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
                <Calendar
                  mode='single'
                  selected={date}
                  onSelect={setDate}
                  className='rounded-md border'
                />
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
                  disabled={loading || !date}
                >
                  {loading ? 'Saving...' : 'Set Available'}
                </Button>
                <Button
                  type='button'
                  variant='destructive'
                  className='flex-1'
                  disabled={loading || !date}
                  onClick={async () => {
                    if (!date || !user) return

                    if (isDateAlreadySet(date)) {
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
                          store_id: unwrappedParams.id,
                          user_id: user.id,
                          date: format(date, 'yyyy-MM-dd'),
                          status: AvailabilityStatus.UNAVAILABLE,
                        })

                      if (error) throw error

                      await fetchAvailability()
                      setDate(undefined)
                      setStartTime('')
                      setEndTime('')
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
      </div>

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
                availability.status === AvailabilityStatus.UNAVAILABLE
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
