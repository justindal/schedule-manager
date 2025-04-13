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
import { AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import { PostgrestError } from '@supabase/supabase-js'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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

function calculateTotalHours(shifts: Shift[], employeeId: string): number {
  return shifts
    .filter((shift) => shift.employee_id === employeeId)
    .reduce((total, shift) => {
      const start = new Date(shift.start_time)
      const end = new Date(shift.end_time)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }, 0)
}

function ShiftCell({
  shift,
  date,
  employee,
  viewOnly,
  setEditingShift,
}: {
  shift: Shift | undefined
  date: Date
  employee: Employee
  viewOnly: boolean
  setEditingShift: (
    data: {
      employeeId: string
      date: Date
      shift?: Shift
    } | null
  ) => void
}) {
  return (
    <TableCell className='text-center p-2 h-16'>
      {shift ? (
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            !viewOnly &&
            setEditingShift({
              employeeId: employee.id,
              date,
              shift,
            })
          }
          disabled={viewOnly}
          className='text-xs h-auto py-1 px-2 w-full'
        >
          <div className='text-sm'>
            {format(new Date(shift.start_time), 'h:mm a')} -{' '}
            {format(new Date(shift.end_time), 'h:mm a')}
            {shift.notes && (
              <div className='text-xs text-muted-foreground truncate max-w-[120px]'>
                {shift.notes}
              </div>
            )}
          </div>
        </Button>
      ) : (
        <Button
          variant='ghost'
          size='sm'
          className='h-10 w-full border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50'
          onClick={() =>
            !viewOnly &&
            setEditingShift({
              employeeId: employee.id,
              date,
            })
          }
          disabled={viewOnly}
        >
          <span className='text-xs text-muted-foreground'>
            {viewOnly ? '—' : 'Add'}
          </span>
        </Button>
      )}
    </TableCell>
  )
}

function ScheduleSkeleton() {
  return (
    <div className='container mx-auto px-4 py-6 max-w-6xl'>
      <div className='flex items-center justify-between mb-6'>
        <Skeleton className='h-8 w-64' />
        <div className='flex space-x-2'>
          <Skeleton className='h-10 w-36' />
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

              {/* Schedule grid */}
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

            <div className='space-y-4'>
              <Skeleton className='h-6 w-48' />
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className='border rounded-md p-4 space-y-2'>
                      <Skeleton className='h-5 w-32' />
                      <Skeleton className='h-4 w-full' />
                      <div className='flex justify-between'>
                        <Skeleton className='h-4 w-24' />
                        <Skeleton className='h-4 w-24' />
                      </div>
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
  const supabase = createClientBrowser()
  const [showAvailabilities, setShowAvailabilities] = useState(false)
  const [managerStatus, setManagerStatus] = useState<string | null>(null)
  const [viewOnly, setViewOnly] = useState(false)
  const [storeName, setStoreName] = useState<string>('')

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
    checkManagerStatus()
  }, [currentWeek, storeId, fetchData, checkManagerStatus])

  async function checkManagerStatus() {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const { data: managerData } = await supabase
      .from('store_managers')
      .select('status')
      .eq('store_id', storeId)
      .eq('manager_id', user.user.id)
      .maybeSingle()

    setManagerStatus(managerData?.status || null)
    setViewOnly(managerData?.status !== 'approved')
  }

  async function fetchData() {
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .single()

      if (storeError) throw storeError
      setStoreName(storeData?.name || '')

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
        .eq('store_id', storeId)
        .eq('status', 'approved')) as {
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

  if (loading) {
    return <ScheduleSkeleton />
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-6 max-w-7xl'>
      {managerStatus && managerStatus !== 'approved' && (
        <Card className='bg-amber-50 border-amber-200 mb-4'>
          <CardContent className='p-4'>
            <div className='flex items-center'>
              <AlertCircle className='h-5 w-5 text-amber-600 mr-2' />
              <div>
                <h3 className='font-medium text-amber-800'>Limited Access</h3>
                <p className='text-sm text-amber-700'>
                  Your manager request is {managerStatus}. You can view
                  schedules but cannot make changes. Contact an approved manager
                  for assistance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
        <h1 className='text-2xl font-semibold'>
          {storeName}{' '}
          <span className='text-muted-foreground font-normal'>Schedule</span>
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

      <div className='flex justify-end'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowAvailabilities(!showAvailabilities)}
              >
                <CalendarIcon className='h-4 w-4 mr-2' />
                {showAvailabilities ? 'Hide' : 'View'} Availabilities
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Show or hide staff availability for the current week
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {showAvailabilities && (
        <Card className='mb-4 animate-in slide-in-from-top-4 duration-300'>
          <CardHeader className='py-4'>
            <CardTitle>Staff Availabilities</CardTitle>
            <CardDescription>Availability for the current week</CardDescription>
          </CardHeader>
          <CardContent className='max-h-[300px] overflow-y-auto'>
            <div className='space-y-4'>
              {employees.map((employee) => {
                const employeeAvailabilities = availabilities.filter(
                  (a) => a.user_id === employee.id
                )
                return (
                  <div key={employee.id} className='space-y-1'>
                    <h5 className='text-sm font-medium'>
                      {employee.full_name}
                    </h5>
                    {employeeAvailabilities.length > 0 ? (
                      <div className='pl-4 space-y-1'>
                        {employeeAvailabilities.map((avail) => (
                          <div key={avail.id} className='text-sm'>
                            {format(new Date(avail.date), 'EEE MMM d')}:{' '}
                            {avail.status === 'available' &&
                            avail.start_time ? (
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
                    ) : (
                      <div className='pl-4 text-sm text-muted-foreground'>
                        No availability set
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className='py-4'>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>View all shifts for {storeName}</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <div className='min-w-[800px]'>
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
                          <ShiftCell
                            key={date.toString()}
                            shift={shift}
                            date={date}
                            employee={employee}
                            viewOnly={viewOnly}
                            setEditingShift={setEditingShift}
                          />
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingShift} onOpenChange={() => setEditingShift(null)}>
        <DialogContent className='sm:max-w-[425px] max-w-[95vw]'>
          <DialogHeader>
            <DialogTitle>
              {editingShift?.shift ? 'Edit Shift' : 'Add Shift'}
              {viewOnly && ' (View Only)'}
            </DialogTitle>
            {editingShift && (
              <DialogDescription>
                {format(editingShift.date, 'EEEE, MMMM d, yyyy')} -{' '}
                {
                  employees.find((e) => e.id === editingShift.employeeId)
                    ?.full_name
                }
                {viewOnly &&
                  ' - You cannot make changes due to your access level.'}
              </DialogDescription>
            )}
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!viewOnly) {
                handleShiftSave(new FormData(e.currentTarget))
              }
            }}
            className='space-y-4'
          >
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='startTime'>Start Time</Label>
                <Input
                  id='startTime'
                  name='startTime'
                  type='time'
                  className='h-10'
                  defaultValue={
                    editingShift?.shift?.start_time
                      ? format(new Date(editingShift.shift.start_time), 'HH:mm')
                      : '09:00'
                  }
                  disabled={viewOnly}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='endTime'>End Time</Label>
                <Input
                  id='endTime'
                  name='endTime'
                  type='time'
                  className='h-10'
                  defaultValue={
                    editingShift?.shift?.end_time
                      ? format(new Date(editingShift.shift.end_time), 'HH:mm')
                      : '17:00'
                  }
                  disabled={viewOnly}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes</Label>
              <Textarea
                id='notes'
                name='notes'
                rows={3}
                placeholder='Optional notes about this shift'
                className='resize-none'
                defaultValue={editingShift?.shift?.notes || ''}
                disabled={viewOnly}
              />
            </div>
            <DialogFooter className='flex-col sm:flex-row sm:justify-end gap-2 sm:gap-0'>
              {!viewOnly && editingShift?.shift && (
                <Button
                  type='button'
                  variant='destructive'
                  className='w-full sm:w-auto order-1 sm:order-none'
                  onClick={handleShiftDelete}
                >
                  Delete Shift
                </Button>
              )}
              <div className='flex justify-end gap-2 w-full sm:w-auto'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setEditingShift(null)}
                >
                  {viewOnly ? 'Close' : 'Cancel'}
                </Button>
                {!viewOnly && <Button type='submit'>Save</Button>}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
