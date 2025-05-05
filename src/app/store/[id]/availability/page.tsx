'use client'

import { useParams } from 'next/navigation'
import { createClientBrowser } from '@/app/utils/supabase/client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  format,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RefreshCcw,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

interface Profile {
  id: string
  role?: string
  full_name: string
  email?: string
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

export default function AvailabilityPage() {
  const params = useParams()
  const storeId = params.id as string
  const supabase = createClientBrowser()

  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [employees, setEmployees] = useState<Profile[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [storeName, setStoreName] = useState<string>('')
  const [isManager, setIsManager] = useState(false)
  const [isEmployee, setIsEmployee] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weekDates = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(currentWeek),
        end: endOfWeek(currentWeek),
      }),
    [currentWeek]
  )

  const availabilityMap = useMemo(() => {
    const map = new Map<string, Availability>()
    availability.forEach((a) => {
      map.set(`${a.user_id}-${a.date}`, a)
    })
    return map
  }, [availability])

  const navigateWeek = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'prev') {
      const newDate = subDays(weekDates[0], 7)
      const newWeekDates = eachDayOfInterval({
        start: startOfWeek(newDate),
        end: endOfWeek(newDate),
      })
      setCurrentWeek(newWeekDates[0])
    } else if (direction === 'next') {
      const newDate = addDays(weekDates[6], 1)
      const newWeekDates = eachDayOfInterval({
        start: startOfWeek(newDate),
        end: endOfWeek(newDate),
      })
      setCurrentWeek(newWeekDates[0])
    } else if (direction === 'today') {
      const today = new Date()
      const newWeekDates = eachDayOfInterval({
        start: startOfWeek(today),
        end: endOfWeek(today),
      })
      setCurrentWeek(newWeekDates[0])
    }
  }

  const fetchWeekAvailability = useCallback(async () => {
    if (!storeId) return

    setIsRefreshing(true)
    try {
      const weekStart = format(weekDates[0], 'yyyy-MM-dd')
      const weekEnd = format(weekDates[6], 'yyyy-MM-dd')
      const { data: availData, error: availError } = await supabase
        .from('availability')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', weekStart)
        .lte('date', weekEnd)

      if (availError) throw new Error('Failed to fetch availabilities')
      setAvailability(availData ?? [])
    } catch (err: unknown) {
      console.error('Error fetching availability:', err)
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to load availability data for this week'
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [supabase, storeId, weekDates])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    let currentIsManager = false
    let currentIsEmployee = false

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw new Error('Authentication error')
      if (!userData.user) {
        setIsManager(false)
        setIsEmployee(false)
        throw new Error('User not logged in')
      }
      const userId = userData.user.id

      const { data: managerData, error: managerError } = await supabase
        .from('store_managers')
        .select('*')
        .eq('store_id', storeId)
        .eq('manager_id', userId)
        .maybeSingle()

      if (managerError) throw new Error('Failed to check manager status')

      currentIsManager =
        managerData !== null && managerData.status === 'approved'
      setIsManager(currentIsManager)

      const { count: employeeCount, error: employeeError } = await supabase
        .from('store_employees')
        .select('employee_id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('employee_id', userId)
      if (employeeError) throw new Error('Failed to check employee status')
      currentIsEmployee = (employeeCount ?? 0) > 0
      setIsEmployee(currentIsEmployee)

      if (!currentIsManager && !currentIsEmployee) {
        throw new Error(
          'Access Denied: You do not have permission to view this page.'
        )
      }

      if (!storeName) {
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('name')
          .eq('id', storeId)
          .single()
        if (storeError) throw new Error('Failed to fetch store name')
        setStoreName(storeData?.name || 'Store')
      }

      const { data: storeEmployees, error: storeError } = await supabase
        .from('store_employees')
        .select(
          `
          employee_id,
          profiles!left (
            id,
            role,
            full_name,
            email
          )
        `
        )
        .eq('store_id', storeId)

      if (storeError) throw new Error('Failed to fetch employees')

      const { data: storeManagers, error: managerError1 } = await supabase
        .from('store_managers')
        .select(`manager_id, is_primary`)
        .eq('store_id', storeId)

      if (managerError1) throw new Error('Failed to fetch managers')

      // Debug the raw data structure
      console.log(
        'DEBUG storeManagers raw data:',
        JSON.stringify(storeManagers, null, 2)
      )

      // Get profile data for managers in a separate query
      const managerIds = storeManagers?.map((m) => m.manager_id) || []
      console.log('DEBUG manager IDs:', managerIds)

      let managerProfiles = []
      if (managerIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', managerIds)

        if (profileError) throw new Error('Failed to fetch manager profiles')
        managerProfiles = profileData || []
        console.log(
          'DEBUG manager profiles:',
          JSON.stringify(managerProfiles, null, 2)
        )
      }

      // Now combine the data into manager objects with profiles
      const managersWithProfiles =
        storeManagers?.map((manager) => {
          const profile = managerProfiles.find(
            (p) => p.id === manager.manager_id
          )
          return {
            ...manager,
            profile,
          }
        }) || []

      const allProfiles = [
        ...(storeEmployees?.flatMap((se) => {
          // Check if profiles is an array and has elements
          const profile =
            Array.isArray(se.profiles) && se.profiles.length > 0
              ? se.profiles[0]
              : null
          return [
            {
              id: se.employee_id,
              full_name: profile?.full_name || 'Unknown Employee',
              email: profile?.email,
              role: profile?.role,
              is_manager: false,
            },
          ]
        }) ?? []),
        ...managersWithProfiles.map((m) => ({
          id: m.manager_id,
          full_name: m.profile?.full_name || 'Unknown Manager',
          email: m.profile?.email,
          role: m.profile?.role,
          is_manager: true,
          is_primary: m.is_primary,
        })),
      ]

      const validProfiles = allProfiles.filter(
        (p) => p !== null && p !== undefined && p.id
      )

      const uniqueProfilesMap = new Map<string, Profile>()
      validProfiles.forEach((item) => {
        if (item && item.id) {
          const existing = uniqueProfilesMap.get(item.id)
          if (!existing || item.is_manager) {
            uniqueProfilesMap.set(item.id, item as Profile)
          }
        } else {
          console.warn('Filtered out an invalid profile item:', item)
        }
      })
      const uniqueProfiles = Array.from(uniqueProfilesMap.values())

      setEmployees(uniqueProfiles)

      const weekStart = format(weekDates[0], 'yyyy-MM-dd')
      const weekEnd = format(weekDates[6], 'yyyy-MM-dd')
      const { data: availData, error: availError } = await supabase
        .from('availability')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', weekStart)
        .lte('date', weekEnd)

      if (availError) throw new Error('Failed to fetch availabilities')
      setAvailability(availData ?? [])
    } catch (err: unknown) {
      console.error('Error loading availability page data:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Error Loading Data',
        description: errorMessage || 'Please try refreshing the page',
      })
      setEmployees([])
      setAvailability([])
    } finally {
      setLoading(false)
    }
  }, [supabase, storeId, weekDates, storeName])

  function getAvailabilityDisplay(userId: string, date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    const avail = availabilityMap.get(`${userId}-${dateStr}`)

    if (!avail) {
      return {
        text: 'Not Set',
        className: 'text-muted-foreground bg-muted/30',
      }
    }

    if (avail.status === 'unavailable') {
      return {
        text: 'Unavailable',
        className: 'text-destructive bg-destructive/20',
      }
    }

    if (avail.start_time && avail.end_time) {
      return {
        text: `${format(
          new Date(`2000-01-01T${avail.start_time}`),
          'h:mm a'
        )} - ${format(new Date(`2000-01-01T${avail.end_time}`), 'h:mm a')}`,
        className: 'text-primary bg-primary/20',
      }
    }

    return {
      text: 'Available',
      className: 'text-green-500 dark:text-green-400 bg-green-500/20',
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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!loading && employees.length > 0) {
      fetchWeekAvailability()
    }
  }, [weekDates, fetchWeekAvailability, loading, employees.length])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8 space-y-6'>
        <ErrorDisplay message={error} onRetry={fetchData} />
      </div>
    )
  }

  if (!isManager && !isEmployee) {
    return (
      <div className='container mx-auto px-4 py-6 max-w-6xl'>
        <Card className='border-destructive'>
          <CardHeader>
            <CardTitle className='text-destructive'>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (employees.length === 0) {
    return <div className='p-4'>No employees found for this store.</div>
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
        <h1 className='text-2xl font-semibold'>
          {storeName}{' '}
          <span className='text-muted-foreground font-normal'>
            Team Availability
          </span>
        </h1>
        <Button onClick={fetchData} variant='outline' size='sm'>
          <RefreshCcw
            className={cn('mr-2 h-3.5 w-3.5', loading && 'animate-spin')}
          />{' '}
          Refresh
        </Button>
      </div>

      <div className='space-y-6'>
        <div className='bg-card rounded-md p-4 border'>
          <div className='flex items-center justify-center gap-3'>
            <Button
              onClick={() => navigateWeek('prev')}
              variant='outline'
              size='icon'
              className='h-8 w-8'
              disabled={isRefreshing}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>

            <Button
              onClick={() => navigateWeek('today')}
              variant='outline'
              size='sm'
              className='h-8'
              disabled={isRefreshing}
            >
              <CalendarDays className='h-4 w-4 mr-2' />
              Today
            </Button>

            <div className='font-medium text-center px-4 py-2 bg-muted rounded-md relative'>
              {isRefreshing && (
                <div className='absolute inset-0 flex items-center justify-center bg-background/60 rounded-md'>
                  <RefreshCcw className='h-4 w-4 animate-spin text-muted-foreground' />
                </div>
              )}
              <div className='hidden sm:block'>
                {format(weekDates[0], 'MMMM d')} -{' '}
                {format(weekDates[6], 'MMMM d, yyyy')}
              </div>
              <div className='sm:hidden'>
                {format(weekDates[0], 'MMM d')} -{' '}
                {format(weekDates[6], 'MMM d')}
              </div>
            </div>

            <Button
              onClick={() => navigateWeek('next')}
              variant='outline'
              size='icon'
              className='h-8 w-8'
              disabled={isRefreshing}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
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
                    const availability = getAvailabilityDisplay(
                      employee.id,
                      date
                    )
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
    </div>
  )
}
