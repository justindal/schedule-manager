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
} from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PostgrestError } from '@supabase/supabase-js'

interface Profile {
  id: string
  role: string
  full_name: string
  email: string
  is_manager?: boolean
}

interface Availability {
  id: string
  store_id: string
  user_id: string
  date: string
  status: 'available' | 'unavailable'
  start_time: string | null
  end_time: string | null
}

interface StoreEmployee {
  employee_id: string
  profiles: Profile
}

interface StoreManager {
  manager_id: string
  is_primary: boolean
  profiles: Profile
}

interface Props {
  storeId: string
}

export default function AvailabilityPage() {
  const params = useParams()
  const storeId = params.id as string

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-2xl font-semibold mb-6'>Staff Availability</h1>
      <AvailabilityTable storeId={storeId} />
    </div>
  )
}

function AvailabilityTable({ storeId }: Props) {
  if (!storeId?.trim()) {
    return (
      <div className='p-4 border border-red-200 rounded-md bg-red-50'>
        <div className='flex items-center gap-2 text-red-700'>
          <AlertCircle className='h-5 w-5' />
          <p>Store ID is required to load availability table</p>
        </div>
      </div>
    )
  }

  const [employees, setEmployees] = useState<Profile[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientBrowser()

  const weekDates = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(currentWeek),
        end: endOfWeek(currentWeek),
      }),
    [currentWeek]
  )

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek((current) =>
      direction === 'next' ? addWeeks(current, 1) : subWeeks(current, 1)
    )
  }

  const availabilityMap = useMemo(() => {
    const map = new Map<string, Availability>()
    availability.forEach((a) => {
      map.set(`${a.user_id}-${a.date}`, a)
    })
    return map
  }, [availability])

  useEffect(() => {
    fetchData()
  }, [currentWeek, storeId])

  async function fetchData() {
    if (!storeId) {
      setError('Store ID is required')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: storeEmployees, error: storeError } = (await supabase
        .from('store_employees')
        .select(
          `
          employee_id,
          profiles!inner (
            id,
            role,
            full_name,
            email
          )
        `
        )
        .eq('store_id', storeId)) as {
        data: StoreEmployee[] | null
        error: PostgrestError | null
      }

      const { data: storeManagers, error: managerError } = (await supabase
        .from('store_managers')
        .select(
          `
          manager_id,
          is_primary,
          profiles!inner (
            id,
            role,
            full_name,
            email
          )
        `
        )
        .eq('store_id', storeId)) as {
        data: StoreManager[] | null
        error: PostgrestError | null
      }

      if (storeError) throw storeError
      if (managerError) throw managerError

      const allProfiles = [
        ...(storeEmployees?.map((se) => ({
          ...se.profiles,
          id: se.profiles.id,
          is_manager: false,
        })) ?? []),
        ...(storeManagers?.map((sm) => ({
          ...sm.profiles,
          id: sm.profiles.id,
          is_manager: true,
          is_primary: sm.is_primary,
        })) ?? []),
      ] as Profile[]

      const uniqueProfiles = Array.from(
        new Map(allProfiles.map((item) => [item.id, item])).values()
      )

      setEmployees(uniqueProfiles)

      const { data: availData, error: availError } = await supabase
        .from('availability')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', format(weekDates[0], 'yyyy-MM-dd'))
        .lte('date', format(weekDates[6], 'yyyy-MM-dd'))

      if (availError) throw availError

      setAvailability(availData ?? [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  function getAvailabilityDisplay(userId: string, date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    const avail = availabilityMap.get(`${userId}-${dateStr}`)

    if (!avail) {
      return {
        text: 'Not Set',
        className: 'text-gray-600 bg-gray-50',
      }
    }

    if (avail.status === 'unavailable') {
      return {
        text: 'Unavailable',
        className: 'text-red-600 bg-red-50',
      }
    }

    if (avail.start_time && avail.end_time) {
      return {
        text: `${avail.start_time.slice(0, 5)} - ${avail.end_time.slice(0, 5)}`,
        className: 'text-blue-600 bg-blue-50',
      }
    }

    return {
      text: 'Available',
      className: 'text-green-600 bg-green-50',
    }
  }

  const LoadingSkeleton = () => (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <Skeleton className='h-10 w-[120px]' />
        <Skeleton className='h-6 w-[200px]' />
        <Skeleton className='h-10 w-[120px]' />
      </div>
      <div className='border rounded-lg p-4'>
        <div className='space-y-4'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='flex gap-4'>
              <Skeleton className='h-12 w-[200px]' />
              {[...Array(7)].map((_, j) => (
                <Skeleton key={j} className='h-12 w-[150px]' />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const ErrorDisplay = ({
    message,
    onRetry,
  }: {
    message: string
    onRetry: () => void
  }) => (
    <div className='p-4 border border-red-200 rounded-md bg-red-50'>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-2 text-red-700'>
          <AlertCircle className='h-5 w-5' />
          <p>{message}</p>
        </div>
        <Button onClick={onRetry} variant='outline' className='w-fit'>
          Retry Loading
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />
  }

  if (employees.length === 0) {
    return <div className='p-4'>No employees found for this store.</div>
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <Button onClick={() => navigateWeek('prev')}>
          &larr; Previous Week
        </Button>
        <span className='font-medium'>
          {format(weekDates[0], 'MMM d')} -{' '}
          {format(weekDates[6], 'MMM d, yyyy')}
        </span>
        <Button onClick={() => navigateWeek('next')}>Next Week &rarr;</Button>
      </div>

      <div className='overflow-x-auto border rounded-lg shadow-sm'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='sticky left-0 bg-muted z-10 w-[200px] text-center'>
                Employee
              </TableHead>
              {weekDates.map((date) => (
                <TableHead
                  key={date.toString()}
                  className='min-w-[150px] text-center'
                >
                  {format(date, 'EEE MMM d')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className='font-medium sticky left-0 bg-background z-10'>
                  {employee.full_name}
                </TableCell>
                {weekDates.map((date) => {
                  const availability = getAvailabilityDisplay(employee.id, date)
                  return (
                    <TableCell
                      key={date.toString()}
                      className={cn('text-center', availability.className)}
                    >
                      {availability.text}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
