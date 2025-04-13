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
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import { PostgrestError } from '@supabase/supabase-js'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
}

interface Employee {
  id: string
  full_name: string
  is_manager: boolean
}

interface Shift {
  id: string
  schedule_id: string
  employee_id: string
  start_time: string
  end_time: string
  notes?: string
}

interface Schedule {
  id: string
  store_id: string
  week_start_date: string
  published: boolean
}

interface AvailabilityData {
  id: string
  user_id: string
  date: string
  status: 'available' | 'unavailable'
  start_time?: string
  end_time?: string
}

interface EmployeeJoinResult {
  employee_id: string | number
  profiles: {
    id: string | number
    full_name: string
  }
}

interface ManagerJoinResult {
  manager_id: string | number
  profiles: {
    id: string | number
    full_name: string
  }
}

function calculateTotalHours(
  shifts: Shift[],
  employeeId: string | number
): number {
  return shifts
    .filter((shift) => shift.employee_id === employeeId)
    .reduce((total, shift) => {
      const start = new Date(shift.start_time)
      const end = new Date(shift.end_time)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }, 0)
}

function ScheduleSkeleton() {
  return (
    <div className='container mx-auto px-4 py-6 max-w-6xl'>
      <div className='flex items-center justify-between mb-6'>
        <Skeleton className='h-8 w-64' />
        <div className='flex space-x-2'>
          <Skeleton className='h-10 w-10' />
          <Skeleton className='h-10 w-10' />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48 mb-2' />
          <Skeleton className='h-4 w-64' />
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Skeleton className='h-6 w-32' />
                <div className='flex space-x-2'>
                  <Skeleton className='h-10 w-10' />
                  <Skeleton className='h-10 w-10' />
                </div>
              </div>

              <div className='grid grid-cols-7 gap-1 text-center'>
                {Array(7)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className='h-10 w-full' />
                  ))}
              </div>

              <div className='space-y-4'>
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className='grid grid-cols-8 gap-1'>
                      <Skeleton className='h-12 w-full' />
                      {Array(7)
                        .fill(0)
                        .map((_, j) => (
                          <Skeleton key={j} className='h-12 w-full' />
                        ))}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EmployeeSchedulePage() {
  const params = useParams()
  const storeId = params.id as string
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [availabilities, setAvailabilities] = useState<AvailabilityData[]>([])
  const [storeName, setStoreName] = useState<string>('')
  const supabase = createClientBrowser()

  const weekDates = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(currentWeek),
        end: endOfWeek(currentWeek),
      }),
    [currentWeek]
  )

  useEffect(() => {
    fetchData()
  }, [currentWeek, storeId])

  async function fetchData() {
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .single()

      if (storeError) throw storeError
      setStoreName(storeData?.name || '')

      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('*')
        .eq('store_id', storeId)
        .eq('week_start_date', format(startOfWeek(currentWeek), 'yyyy-MM-dd'))
        .single()

      if (scheduleData) {
        const { data: shiftData } = await supabase
          .from('shifts')
          .select('*')
          .eq('schedule_id', scheduleData.id)

        setShifts(shiftData ?? [])
      }

      const { data: employeeData, error: employeeError } = (await supabase
        .from('store_employees')
        .select(
          `
          employee_id,
          profiles!inner (
            id,
            full_name
          )
        `
        )
        .eq('store_id', storeId)) as {
        data: EmployeeJoinResult[] | null
        error: PostgrestError | null
      }

      if (employeeError) throw employeeError

      const { data: managerData, error: managerError } = (await supabase
        .from('store_managers')
        .select(
          `
          manager_id,
          profiles!inner (
            id,
            full_name
          )
        `
        )
        .eq('store_id', storeId)
        .eq('status', 'approved')) as {
        data: ManagerJoinResult[] | null
        error: PostgrestError | null
      }

      if (managerError) throw managerError
      const staffMap = new Map()

      employeeData?.forEach((item) => {
        staffMap.set(item.employee_id, {
          id: item.employee_id,
          full_name: item.profiles.full_name,
          is_manager: false,
        })
      })

      managerData?.forEach((item) => {
        if (staffMap.has(item.manager_id)) {
          const existingEntry = staffMap.get(item.manager_id)
          existingEntry.is_manager = true
        } else {
          staffMap.set(item.manager_id, {
            id: item.manager_id,
            full_name: item.profiles.full_name,
            is_manager: true,
          })
        }
      })

      setEmployees(Array.from(staffMap.values()))

      const { data: availabilityData } = await supabase
        .from('availability')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', format(weekDates[0], 'yyyy-MM-dd'))
        .lte('date', format(weekDates[6], 'yyyy-MM-dd'))

      setAvailabilities(availabilityData ?? [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <ScheduleSkeleton />
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <TooltipProvider>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
          <h1 className='text-2xl font-semibold'>
            {storeName}{' '}
            <span className='text-muted-foreground font-normal'>Schedule</span>
          </h1>
          <div className='text-sm text-muted-foreground'>
            Week of {format(weekDates[0], 'MMMM d, yyyy')}
          </div>
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
                {format(weekDates[0], 'MMM d')} -{' '}
                {format(weekDates[6], 'MMM d')}
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

        <Card>
          <CardHeader className='py-4'>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>View all shifts for {storeName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[200px] sticky left-0 bg-background z-10'>
                      Employee
                    </TableHead>
                    {weekDates.map((date) => (
                      <TableHead
                        key={date.toString()}
                        className='text-center min-w-[150px]'
                      >
                        <div className='hidden sm:block'>
                          {format(date, 'EEE ')}
                          {format(date, 'MMM d')}
                        </div>
                        <div className='sm:hidden'>
                          {format(date, 'E ')}
                          {format(date, 'd')}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className='text-center w-[100px]'>
                      Hours
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className='font-medium sticky left-0 bg-background z-10'>
                        {employee.full_name}
                      </TableCell>
                      {weekDates.map((date) => {
                        const shift = shifts.find(
                          (s) =>
                            s.employee_id === employee.id &&
                            format(new Date(s.start_time), 'yyyy-MM-dd') ===
                              format(date, 'yyyy-MM-dd')
                        )
                        return (
                          <TableCell
                            key={date.toString()}
                            className='text-center p-0'
                          >
                            <div className='w-full h-full p-2'>
                              {shift ? (
                                <div className='text-sm'>
                                  {format(new Date(shift.start_time), 'h:mm a')}{' '}
                                  - {format(new Date(shift.end_time), 'h:mm a')}
                                  {shift.notes && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className='h-3 w-3 inline-block ml-1 text-muted-foreground' />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {shift.notes}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              ) : (
                                <div className='text-gray-400'>-</div>
                              )}
                            </div>
                          </TableCell>
                        )
                      })}
                      <TableCell className='text-center font-medium'>
                        {calculateTotalHours(shifts, employee.id).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  )
}
