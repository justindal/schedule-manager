'use client'

import { useParams } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/client'
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

export default function EmployeeSchedulePage() {
  const params = useParams()
  const storeId = params.id as string
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [availabilities, setAvailabilities] = useState<AvailabilityData[]>([])
  const supabase = createClient()

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
        error: any
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
        error: any
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
      <div className='flex items-center justify-between'>
        <Button onClick={() => setCurrentWeek((prev) => subWeeks(prev, 1))}>
          Previous Week
        </Button>
        <span className='font-medium'>
          {format(weekDates[0], 'MMM d')} -{' '}
          {format(weekDates[6], 'MMM d, yyyy')}
        </span>
        <Button onClick={() => setCurrentWeek((prev) => addWeeks(prev, 1))}>
          Next Week
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[200px]'>Employee</TableHead>
              {weekDates.map((date) => (
                <TableHead
                  key={date.toString()}
                  className='text-center min-w-[150px]'
                >
                  {format(date, 'EEE ')}
                  {format(date, 'MMM d')}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className='font-medium'>
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
                    <TableCell key={date.toString()} className='text-center'>
                      {shift ? (
                        <div className='text-sm'>
                          {format(new Date(shift.start_time), 'h:mm a')} -{' '}
                          {format(new Date(shift.end_time), 'h:mm a')}
                        </div>
                      ) : (
                        <div className='text-gray-400'>-</div>
                      )}
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
