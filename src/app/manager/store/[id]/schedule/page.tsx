'use client'

import { useParams } from 'next/navigation'
import { createClientBrowser } from '@/app/utils/supabase/client'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  format,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  parseISO,
  isSameDay,
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
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  RefreshCcw,
} from 'lucide-react'
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
import { PostgrestError } from '@supabase/supabase-js'
import { Textarea } from '@/components/ui/textarea'
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
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

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

interface ProcessingCell {
  employeeId: string
  date: string
  action: 'save' | 'delete'
}

interface PendingOperation {
  type: 'create' | 'update' | 'delete'
  status: 'pending' | 'success' | 'error'
  timestamp: number
  employeeId: string
  dateString: string
  data?: ShiftFormValues
}

interface ShiftFormValues {
  startTime: string
  endTime: string
  notes?: string
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

function isCellProcessing(
  employeeId: string,
  dateString: string,
  pendingOps: Record<string, PendingOperation>
): boolean {
  return Object.values(pendingOps).some(
    (op) =>
      op.employeeId === employeeId &&
      op.dateString === dateString &&
      op.status === 'pending'
  )
}

function ShiftCell({
  shift,
  date,
  employee,
  viewOnly,
  setEditingShift,
  pendingOperations,
  setEditingEmployee,
  setOpenShiftDialog,
  setIsUpdate,
  isShiftLoading,
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
  pendingOperations: Record<string, PendingOperation>
  setEditingEmployee: (data: { id: string; name: string } | null) => void
  setOpenShiftDialog: (open: boolean) => void
  setIsUpdate: (value: boolean) => void
  isShiftLoading: (shiftId?: string) => boolean
}) {
  const dateString = format(date, 'yyyy-MM-dd')
  const isLoading = shift && isShiftLoading(shift.id)

  const operationKey = Object.keys(pendingOperations).find((key) => {
    const op = pendingOperations[key]
    return op.employeeId === employee.id && op.dateString === dateString
  })

  const pendingOp = operationKey ? pendingOperations[operationKey] : null
  const isProcessing = pendingOp?.status === 'pending'
  const operationType = pendingOp?.type

  const getTimeDisplay = () => {
    if (shift) {
      return (
        format(new Date(shift.start_time), 'h:mm a') +
        ' - ' +
        format(new Date(shift.end_time), 'h:mm a')
      )
    } else if (pendingOp?.data?.startTime && pendingOp?.data?.endTime) {
      const formatTime = (time24: string) => {
        const [hours, minutes] = time24.split(':').map(Number)
        const period = hours >= 12 ? 'PM' : 'AM'
        const hours12 = hours % 12 || 12
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
      }

      return (
        formatTime(pendingOp.data.startTime) +
        ' - ' +
        formatTime(pendingOp.data.endTime)
      )
    } else {
      return '9:00 AM - 5:00 PM'
    }
  }

  return (
    <TableCell className='text-center p-2 h-16'>
      {isProcessing && operationType === 'delete' ? (
        <div className='w-full h-full flex items-center justify-center'>
          <div className='h-12 w-full bg-red-50 border border-red-100 animate-pulse rounded-md flex items-center justify-center'>
            <div className='text-xs text-muted-foreground opacity-70'>
              {shift ? getTimeDisplay() : 'Deleting...'}
            </div>
          </div>
        </div>
      ) : isProcessing && operationType === 'create' ? (
        <div className='w-full h-full flex items-center justify-center'>
          <div className='h-12 w-full bg-blue-50 border border-blue-100 animate-pulse rounded-md flex items-center justify-center'>
            <div className='text-xs text-muted-foreground opacity-70'>
              {getTimeDisplay()}
            </div>
          </div>
        </div>
      ) : isProcessing && operationType === 'update' ? (
        <div className='w-full h-full flex items-center justify-center'>
          <div className='h-12 w-full bg-amber-50 border border-amber-100 animate-pulse rounded-md flex items-center justify-center'>
            <div className='text-xs text-muted-foreground opacity-70'>
              {getTimeDisplay()}
            </div>
          </div>
        </div>
      ) : shift ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  if (!viewOnly) {
                    setEditingShift({
                      employeeId: employee.id,
                      date,
                      shift,
                    })
                    setEditingEmployee({
                      id: employee.id,
                      name: employee.full_name,
                    })
                    setOpenShiftDialog(true)
                    setIsUpdate(true)
                  }
                }}
                disabled={viewOnly || isProcessing || isLoading}
                className='text-xs h-auto py-1 px-2 w-full'
              >
                <div className='text-sm'>
                  {isLoading ? (
                    <span className='animate-pulse'>Loading...</span>
                  ) : (
                    <div className='flex items-center gap-1 justify-center'>
                      <span>{getTimeDisplay()}</span>
                      {shift.notes && (
                        <FileText className='h-3 w-3 text-muted-foreground' />
                      )}
                    </div>
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            {shift.notes && (
              <TooltipContent>
                <p className='max-w-xs font-normal break-words'>
                  {shift.notes}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button
          variant='ghost'
          size='sm'
          className='h-10 w-full border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50'
          onClick={() => {
            if (!viewOnly) {
              setEditingShift({
                employeeId: employee.id,
                date,
              })
              setEditingEmployee({
                id: employee.id,
                name: employee.full_name,
              })
              setOpenShiftDialog(true)
              setIsUpdate(false)
            }
          }}
          disabled={viewOnly || isProcessing}
        >
          <Plus className='h-4 w-4 text-muted-foreground' />
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
  const { toast } = useToast()
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
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
  const [processingCells, setProcessingCells] = useState<ProcessingCell[]>([])
  const processingTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
  const [pendingOperations, setPendingOperations] = useState<
    Record<string, PendingOperation>
  >({})
  const [editingEmployee, setEditingEmployee] = useState<{
    id: string
    name: string
  } | null>(null)
  const [openShiftDialog, setOpenShiftDialog] = useState(false)
  const [loadingShiftIds, setLoadingShiftIds] = useState<Set<string>>(new Set())
  const [isUpdate, setIsUpdate] = useState(false)

  const weekDates = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(currentWeek),
        end: endOfWeek(currentWeek),
      }),
    [currentWeek]
  )

  function getOperationKey(
    employeeId: string,
    date: string,
    type: 'create' | 'update' | 'delete'
  ) {
    return `${employeeId}:${date}:${type}:${Date.now()}`
  }

  const cleanupOldOperations = useCallback(() => {
    const now = Date.now()
    setPendingOperations((prev) => {
      const newOperations = { ...prev }
      Object.keys(newOperations).forEach((key) => {
        if (now - newOperations[key].timestamp > 30000) {
          delete newOperations[key]
        }
      })
      return newOperations
    })
  }, [setPendingOperations])

  const checkManagerStatus = useCallback(async () => {
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
  }, [supabase, storeId])

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

  const fetchData = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You must be logged in to view this page',
        })
        return
      }

      if (!storeName) {
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('name')
          .eq('id', storeId)
          .single()

        if (storeError) throw storeError
        setStoreName(storeData?.name || '')
      }

      if (employees.length === 0) {
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
        ).sort((a, b) => a.full_name.localeCompare(b.full_name))

        setEmployees(uniqueStaff)
      }

      const currentSchedule = await getOrCreateSchedule()

      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('schedule_id', currentSchedule.id)

      if (shiftError) throw shiftError
      setShifts(shiftData ?? [])

      let availabilityQuery = supabase
        .from('availability')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', format(weekDates[0], 'yyyy-MM-dd'))
        .lte('date', format(weekDates[6], 'yyyy-MM-dd'))

      if (managerStatus !== 'approved') {
        availabilityQuery = availabilityQuery.eq('user_id', user.user.id)
      }

      const { data: availabilityData } = await availabilityQuery

      setAvailabilities(availabilityData ?? [])
    } catch (error) {
      console.error(
        'Error fetching data:',
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error),
        {
          storeId,
          weekDates: weekDates.map((d) => format(d, 'yyyy-MM-dd')),
        }
      )

      toast({
        variant: 'destructive',
        title: 'Error loading schedule data',
        description: 'Please try refreshing the page',
      })
    } finally {
      setLoading(false)
    }
  }, [
    supabase,
    storeId,
    storeName,
    employees.length,
    weekDates,
    toast,
    managerStatus,
  ])

  const isShiftLoading = useCallback(
    (shiftId?: string) => {
      if (!shiftId) return false
      return loadingShiftIds.has(shiftId)
    },
    [loadingShiftIds]
  )

  const setShiftLoading = useCallback((shiftId: string, loading: boolean) => {
    setLoadingShiftIds((prev) => {
      const newSet = new Set(prev)
      if (loading) {
        newSet.add(shiftId)
      } else {
        newSet.delete(shiftId)
      }
      return newSet
    })
  }, [])

  const formatShiftTime = useCallback((timeString: string) => {
    const date = new Date(timeString)
    return format(date, 'h:mm a')
  }, [])

  const employeeRows = useMemo(
    () =>
      employees.map((employee) => (
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
                pendingOperations={pendingOperations}
                setEditingEmployee={setEditingEmployee}
                setOpenShiftDialog={setOpenShiftDialog}
                setIsUpdate={setIsUpdate}
                isShiftLoading={isShiftLoading}
              />
            )
          })}
          <TableCell className='text-center font-medium'>
            {calculateTotalHours(shifts, employee.id).toFixed(2)}
          </TableCell>
        </TableRow>
      )),
    [employees, weekDates, shifts, viewOnly, pendingOperations, isShiftLoading]
  )

  useEffect(() => {
    fetchData()
    checkManagerStatus()
  }, [currentWeek, storeId, fetchData, checkManagerStatus])

  useEffect(() => {
    return () => {
      Object.values(processingTimeouts.current).forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    const createIndex = async () => {
      try {
        const supabase = createClientBrowser()
        await supabase
          .rpc('execute_sql', {
            sql: 'CREATE INDEX IF NOT EXISTS shifts_schedule_id_idx ON shifts (schedule_id)',
          })
          .then(() => {
            console.log('Index created or already exists')
          })
      } catch (error) {
        console.log(
          'Error creating index:',
          error instanceof Error ? error.message : String(error)
        )
      }
    }
    createIndex()
  }, [])

  useEffect(() => {
    const interval = setInterval(cleanupOldOperations, 10000)
    return () => clearInterval(interval)
  }, [cleanupOldOperations])

  function removeProcessingCell(employeeId: string, date: string) {
    setProcessingCells((prev) =>
      prev.filter(
        (cell) => !(cell.employeeId === employeeId && cell.date === date)
      )
    )

    const key = `${employeeId}-${date}`
    if (processingTimeouts.current[key]) {
      clearTimeout(processingTimeouts.current[key])
      delete processingTimeouts.current[key]
    }
  }

  function setProcessingWithTimeout(
    employeeId: string,
    date: string,
    action: 'save' | 'delete'
  ) {
    setProcessingCells((prev) => [
      ...prev,
      {
        employeeId,
        date,
        action,
      },
    ])

    const key = `${employeeId}-${date}`
    if (processingTimeouts.current[key]) {
      clearTimeout(processingTimeouts.current[key])
    }

    processingTimeouts.current[key] = setTimeout(() => {
      removeProcessingCell(employeeId, date)
    }, 3000)
  }

  async function handleShiftSave(formData: FormData) {
    if (!editingShift || !schedule) return

    setSubmitLoading(true)

    const operationId = editingShift.shift?.id || `new-${Date.now()}`
    setShiftLoading(operationId, true)

    try {
      setOpenShiftDialog(false)

      const startTime = formData.get('startTime') as string
      const endTime = formData.get('endTime') as string
      const notes = formData.get('notes') as string

      const dateString = format(editingShift.date, 'yyyy-MM-dd')
      const employeeId = editingShift.employeeId
      const employeeName =
        employees.find((e) => e.id === employeeId)?.full_name || 'Employee'
      const isNewShift = !editingShift.shift

      setProcessingWithTimeout(employeeId, dateString, 'save')

      const localDate = new Date(dateString)
      const tzOffset = localDate.getTimezoneOffset() * 60000

      const startDateTime = new Date(`${dateString}T${startTime}:00`)
      const endDateTime = new Date(`${dateString}T${endTime}:00`)

      const startISOString = startDateTime.toISOString()
      const endISOString = endDateTime.toISOString()

      let result
      if (isNewShift) {
        result = await supabase
          .from('shifts')
          .insert({
            schedule_id: schedule.id,
            employee_id: employeeId,
            start_time: startISOString,
            end_time: endISOString,
            notes: notes || null,
          })
          .select('id')
      } else if (editingShift.shift) {
        result = await supabase
          .from('shifts')
          .update({
            start_time: startISOString,
            end_time: endISOString,
            notes: notes || null,
          })
          .eq('id', editingShift.shift.id)
          .select('id')
      }

      toast({
        title: isNewShift ? 'Shift added' : 'Shift updated',
        description: `${employeeName} on ${format(
          editingShift.date,
          'EEE, MMM d'
        )}`,
      })

      await fetchData()
    } catch (error) {
      console.error('Error saving shift:', error)
      toast({
        variant: 'destructive',
        title: 'Error saving shift',
        description: 'Please try again',
      })
    } finally {
      setTimeout(() => {
        setSubmitLoading(false)
        setShiftLoading(operationId, false)
        setEditingShift(null)
        setEditingEmployee(null)
      }, 300)
    }
  }

  async function handleShiftDelete() {
    if (!editingShift?.shift || !schedule) return

    setSubmitLoading(true)
    const shiftId = editingShift.shift.id
    setShiftLoading(shiftId, true)

    try {
      setOpenShiftDialog(false)

      const dateString = format(editingShift.date, 'yyyy-MM-dd')
      const employeeId = editingShift.employeeId
      const employeeName =
        employees.find((e) => e.id === employeeId)?.full_name || 'Employee'

      setProcessingWithTimeout(employeeId, dateString, 'delete')

      await supabase.from('shifts').delete().eq('id', shiftId)

      toast({
        title: 'Shift deleted',
        description: `${employeeName} on ${format(
          editingShift.date,
          'EEE, MMM d'
        )}`,
      })

      await fetchData()
    } catch (error) {
      console.error('Error deleting shift:', error)
      toast({
        variant: 'destructive',
        title: 'Error deleting shift',
        description: 'Please try again',
      })
    } finally {
      setTimeout(() => {
        setSubmitLoading(false)
        setShiftLoading(shiftId, false)
        setEditingShift(null)
        setEditingEmployee(null)
      }, 300)
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

      <div className='flex justify-end gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => fetchData()}
          className='flex items-center gap-1'
        >
          <RefreshCcw className='h-3.5 w-3.5' />
          Refresh
        </Button>
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
                        {employeeAvailabilities.map((avail) => {
                          const availDate = parseISO(avail.date)
                          return (
                            <div key={avail.id} className='text-sm'>
                              {format(availDate, 'EEE MMM d')}:{' '}
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
                                <span className='text-red-600'>
                                  Unavailable
                                </span>
                              )}
                            </div>
                          )
                        })}
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
        <CardHeader className='py-4 flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>View all shifts for {storeName}</CardDescription>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => fetchData()}
            className='flex items-center gap-1'
          >
            <RefreshCcw className='h-3.5 w-3.5' />
            Refresh
          </Button>
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
                <TableBody>{employeeRows}</TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={openShiftDialog}
        onOpenChange={(open) => {
          if (!open) {
            setOpenShiftDialog(false)
            if (loadingShiftIds.size === 0) {
              setEditingShift(null)
              setEditingEmployee(null)
            }
          }
        }}
      >
        <DialogContent className='sm:max-w-[425px] max-w-[95vw]'>
          <DialogHeader>
            <DialogTitle>
              {editingShift?.shift ? 'Edit Shift' : 'Add Shift'}
              {viewOnly && ' (View Only)'}
            </DialogTitle>
            {editingShift && editingEmployee && (
              <DialogDescription>
                {format(editingShift.date, 'EEEE, MMMM d, yyyy')} -{' '}
                {editingEmployee.name}
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
                {editingShift?.shift?.start_time && (
                  <p className='text-xs text-muted-foreground'>
                    {format(new Date(editingShift.shift.start_time), 'h:mm a')}
                  </p>
                )}
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
                {editingShift?.shift?.end_time && (
                  <p className='text-xs text-muted-foreground'>
                    {format(new Date(editingShift.shift.end_time), 'h:mm a')}
                  </p>
                )}
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
                  disabled={submitLoading || viewOnly}
                >
                  {submitLoading ? 'Deleting...' : 'Delete Shift'}
                </Button>
              )}
              <div className='flex justify-end gap-2 w-full sm:w-auto'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setOpenShiftDialog(false)
                    if (loadingShiftIds.size === 0) {
                      setEditingShift(null)
                      setEditingEmployee(null)
                    }
                  }}
                  disabled={submitLoading}
                >
                  {viewOnly ? 'Close' : 'Cancel'}
                </Button>
                {!viewOnly && (
                  <Button type='submit' disabled={submitLoading}>
                    {submitLoading ? 'Saving...' : 'Save'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
