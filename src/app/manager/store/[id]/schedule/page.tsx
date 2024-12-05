// app/(dashboard)/manager/store/[id]/schedule/page.tsx
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
import { AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface EmployeeJoinResult {
  employee_id: string
  profiles: Profile
}

interface ManagerJoinResult {
  manager_id: string
  profiles: Profile
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
  break_duration?: string
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

export default function SchedulePage() {
  const params = useParams()
  const storeId = params.id as string
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [editingShift, setEditingShift] = useState<{
    employeeId: string
    date: Date
    shift?: Shift
  } | null>(null)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
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

      const currentSchedule = await getOrCreateSchedule()

      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('schedule_id', currentSchedule.id)

      if (shiftError) throw shiftError
      setShifts(shiftData ?? [])

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

  async function getOrCreateSchedule() {
    const weekStart = format(startOfWeek(currentWeek), 'yyyy-MM-dd')

    const { data: existingSchedule } = await supabase
      .from('schedules')
      .select('*')
      .eq('store_id', storeId)
      .eq('week_start_date', weekStart)
      .single()

    if (existingSchedule) {
      setSchedule(existingSchedule)
      return existingSchedule
    }

    const { data: newSchedule } = await supabase
      .from('schedules')
      .insert({
        store_id: storeId,
        week_start_date: weekStart,
        published: false,
      })
      .select()
      .single()

    setSchedule(newSchedule)
    return newSchedule
  }

  async function handleShiftSave(formData: FormData) {
    if (!editingShift || !schedule) return

    const startDate = new Date(editingShift.date)
    const endDate = new Date(editingShift.date)

    const [startHours, startMinutes] = (
      formData.get('startTime') as string
    ).split(':')
    const [endHours, endMinutes] = (formData.get('endTime') as string).split(
      ':'
    )

    startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)
    endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)

    try {
      if (editingShift.shift?.id) {
        await supabase
          .from('shifts')
          .update({
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            notes: formData.get('notes'),
          })
          .eq('id', editingShift.shift.id)
      } else {
        await supabase.from('shifts').insert({
          schedule_id: schedule.id,
          employee_id: editingShift.employeeId,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          notes: formData.get('notes'),
        })
      }

      await fetchData()
      setEditingShift(null)
    } catch (error) {
      console.error('Error saving shift:', error)
    }
  }

  async function handleShiftDelete() {
    if (!editingShift?.shift?.id) return

    try {
      await supabase.from('shifts').delete().eq('id', editingShift.shift.id)

      await fetchData()
      setEditingShift(null)
    } catch (error) {
      console.error('Error deleting shift:', error)
    }
  }

  function AvailabilityPopover() {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='outline' size='sm'>
            <CalendarIcon className='h-4 w-4 mr-2' />
            View Availabilities
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-80'>
          <div className='space-y-4'>
            <h4 className='font-medium'>Staff Availabilities</h4>
            <div className='space-y-2'>
              {employees.map((employee) => {
                const employeeAvailabilities = availabilities.filter(
                  (a) => a.user_id === employee.id
                )
                return (
                  <div key={employee.id} className='space-y-1'>
                    <h5 className='text-sm font-medium'>
                      {employee.full_name}
                    </h5>
                    <div className='pl-4 space-y-1'>
                      {employeeAvailabilities.map((avail) => (
                        <div key={avail.id} className='text-sm'>
                          {format(new Date(avail.date), 'EEE MMM d')}:{' '}
                          {avail.status === 'available' && avail.start_time ? (
                            <span className='text-green-600'>
                              {format(
                                new Date(`2000-01-01T${avail.start_time}`),
                                'h:mm a'
                              )}{' '}
                              -{' '}
                              {format(
                                new Date(`2000-01-01T${avail.end_time}`),
                                'h:mm a'
                              )}
                            </span>
                          ) : (
                            <span className='text-red-600'>Unavailable</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
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
      <div className='flex justify-end'>
        <AvailabilityPopover />
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
                    <TableCell
                      key={date.toString()}
                      className='text-center p-0'
                    >
                      <Button
                        variant='ghost'
                        className='w-full h-full p-2'
                        onClick={() =>
                          setEditingShift({
                            employeeId: employee.id,
                            date,
                            shift,
                          })
                        }
                      >
                        {shift ? (
                          <div className='text-sm'>
                            {format(new Date(shift.start_time), 'h:mm a')} -
                            {format(new Date(shift.end_time), 'h:mm a')}
                          </div>
                        ) : (
                          <div className='text-gray-400'>-</div>
                        )}
                      </Button>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!editingShift} onOpenChange={() => setEditingShift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingShift?.shift ? 'Edit Shift' : 'Add Shift'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleShiftSave(new FormData(e.currentTarget))
            }}
            className='space-y-4'
          >
            <div className='space-y-2'>
              <Label htmlFor='startTime'>Start Time</Label>
              <Input
                id='startTime'
                name='startTime'
                type='time'
                defaultValue={
                  editingShift?.shift?.start_time
                    ? format(new Date(editingShift.shift.start_time), 'HH:mm')
                    : '09:00'
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='endTime'>End Time</Label>
              <Input
                id='endTime'
                name='endTime'
                type='time'
                defaultValue={
                  editingShift?.shift?.end_time
                    ? format(new Date(editingShift.shift.end_time), 'HH:mm')
                    : '17:00'
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes</Label>
              <Input
                id='notes'
                name='notes'
                defaultValue={editingShift?.shift?.notes}
              />
            </div>
            <div className='flex justify-end gap-2'>
              {editingShift?.shift && (
                <Button
                  type='button'
                  variant='destructive'
                  onClick={handleShiftDelete}
                >
                  Clear Shift
                </Button>
              )}
              <Button
                type='button'
                variant='outline'
                onClick={() => setEditingShift(null)}
              >
                Cancel
              </Button>
              <Button type='submit'>Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
