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

export default function EmployeeSchedulePage() {
  const params = useParams()
  const storeId = params.id as string
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [availabilities, setAvailabilities] = useState<AvailabilityData[]>([])
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
        .eq('store_id', storeId)) as {
        data: ManagerJoinResult[] | null
        error: PostgrestError | null
      }

      if (employeeError) throw employeeError
      if (managerError) throw managerError

      const allStaff = [
        ...(employeeData?.map((e) => ({
          id: e.employee_id,
          full_name: e.profiles.full_name,
          is_manager: false,
        })) ?? []),
        ...(managerData?.map((m) => ({
          id: m.manager_id,
          full_name: m.profiles.full_name,
          is_manager: true,
        })) ?? []),
      ] as Employee[]

      const uniqueStaff = Array.from(
        new Map(allStaff.map((item) => [item.id, item])).values()
      )

      setEmployees(uniqueStaff)

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
    return <Skeleton className='w-full h-[600px]' />
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <TooltipProvider>
        <h1 className='text-2xl font-semibold mb-6 text-center sm:text-left'>
          My Schedule
        </h1>

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
            <CardDescription>
              View your assigned shifts for the week
            </CardDescription>
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
