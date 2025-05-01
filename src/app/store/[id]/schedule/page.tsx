'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { createClientBrowser } from '@/app/utils/supabase/client'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  format,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  ScheduleSkeleton,
  WeekNavigation,
  ScheduleTable,
  Employee,
  Shift,
  Schedule,
  EmployeeJoinResult,
  ManagerJoinResult,
  AvailabilityViewer,
  AvailabilityToggle,
  AvailabilityData,
} from '@/components/schedule'

export default function SchedulePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const storeId = params.id as string
  const isManagerView = searchParams.get('manage') === 'true'
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [storeName, setStoreName] = useState<string>('')
  const [isManager, setIsManager] = useState(false)
  const [isEmployee, setIsEmployee] = useState(false)
  const supabase = createClientBrowser()
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editingDate, setEditingDate] = useState<Date | null>(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [availabilities, setAvailabilities] = useState<AvailabilityData[]>([])
  const [showAvailabilities, setShowAvailabilities] = useState(false)
  const [isLoadingAvailabilities, setIsLoadingAvailabilities] = useState(false)

  const weekDates = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(currentWeek),
        end: endOfWeek(currentWeek),
      }),
    [currentWeek]
  )

  const checkUserRole = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return { isManager: false, isEmployee: false }

      const { data: managerData } = await supabase
        .from('store_managers')
        .select('*')
        .eq('store_id', storeId)
        .eq('manager_id', userData.user.id)
        .maybeSingle()

      setIsManager(!!managerData)

      const { data: employeeData } = await supabase
        .from('store_employees')
        .select('*')
        .eq('store_id', storeId)
        .eq('employee_id', userData.user.id)
        .maybeSingle()

      setIsEmployee(!!employeeData)

      return { isManager: !!managerData, isEmployee: !!employeeData }
    } catch (error) {
      console.error('Error checking user role:', error)
      return { isManager: false, isEmployee: false }
    }
  }, [supabase, storeId])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You must be logged in to view this page',
        })
        setLoading(false)
        return
      }

      if (!storeName) {
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('name')
          .eq('id', storeId)
          .single()

        if (storeData) {
          setStoreName(storeData?.name || '')
        }
      }

      const weekStart = format(startOfWeek(currentWeek), 'yyyy-MM-dd')
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('*')
        .eq('store_id', storeId)
        .eq('week_start_date', weekStart)
        .maybeSingle()

      if (scheduleData) {
        const { data: shiftData } = await supabase
          .from('shifts')
          .select('*')
          .eq('schedule_id', scheduleData.id)

        setShifts(shiftData ?? [])
      } else {
        setShifts([])
      }

      const userRole = await checkUserRole()

      if (userRole.isManager && isManagerView) {
        const { data: employeeData } = await supabase
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
          .eq('store_id', storeId)

        const { data: managerData } = await supabase
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

        const staffMap = new Map<string, Employee>()

        employeeData?.forEach((item) => {
          if (item.profiles && item.profiles.length > 0) {
            const profile = item.profiles[0]
            staffMap.set(item.employee_id, {
              id: item.employee_id,
              full_name: profile.full_name,
              is_manager: false,
            })
          }
        })

        managerData?.forEach((item) => {
          if (item.profiles && item.profiles.length > 0) {
            const profile = item.profiles[0]
            if (staffMap.has(item.manager_id)) {
              const existingEntry = staffMap.get(item.manager_id)!
              existingEntry.is_manager = true
            } else {
              staffMap.set(item.manager_id, {
                id: item.manager_id,
                full_name: profile.full_name,
                is_manager: true,
              })
            }
          }
        })

        setEmployees(Array.from(staffMap.values()))
      } else {
        const { data: employeeData } = await supabase
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
          .eq('store_id', storeId)

        const staffList =
          employeeData?.flatMap((e) => {
            if (e.profiles && e.profiles.length > 0) {
              const profile = e.profiles[0]
              return [
                {
                  id: e.employee_id,
                  full_name: profile.full_name,
                  is_manager: false,
                },
              ]
            }
            return []
          }) || []

        setEmployees(staffList)
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error)
      toast({
        variant: 'destructive',
        title: 'Error loading schedule data',
        description: 'Please try refreshing the page',
      })
      setShifts([])
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [supabase, storeId, storeName, currentWeek, checkUserRole, isManagerView])

  useEffect(() => {
    fetchData()
  }, [fetchData, currentWeek])

  const extractTimeFromShift = (timeString: string) => {
    try {
      if (timeString.includes('T')) {
        return timeString.split('T')[1].slice(0, 5)
      }
      return timeString.slice(0, 5)
    } catch (error) {
      console.error('Error extracting time:', error)
      return ''
    }
  }

  useEffect(() => {
    if (shiftModalOpen) {
      if (editingShift) {
        setStartTime(extractTimeFromShift(editingShift.start_time))
        setEndTime(extractTimeFromShift(editingShift.end_time))
        setNotes(editingShift?.notes || '')
      } else {
        setStartTime('09:00')
        setEndTime('17:00')
        setNotes('')
      }
    }
  }, [shiftModalOpen, editingShift])

  const handleShiftClick = useCallback(
    ({
      employeeId,
      date,
      shift,
    }: {
      employeeId: string
      date: Date
      shift?: Shift
    }) => {
      setEditingEmployee(employees.find((e) => e.id === employeeId) || null)
      setEditingDate(date)
      setEditingShift(shift || null)
      setShiftModalOpen(true)
    },
    [employees]
  )

  const closeShiftModal = useCallback(() => {
    setShiftModalOpen(false)
    setEditingShift(null)
    setEditingEmployee(null)
    setEditingDate(null)
  }, [])

  async function getOrCreateScheduleId() {
    const weekStart = format(startOfWeek(currentWeek), 'yyyy-MM-dd')
    const { data: scheduleData, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('store_id', storeId)
      .eq('week_start_date', weekStart)
      .maybeSingle()
    if (scheduleData) return scheduleData.id
    const { data: newSchedule, error: createError } = await supabase
      .from('schedules')
      .insert({
        store_id: storeId,
        week_start_date: weekStart,
        published: false,
      })
      .select()
      .maybeSingle()
    if (newSchedule) return newSchedule.id
    throw createError || error || new Error('Failed to get or create schedule')
  }

  async function handleSaveShift() {
    if (!editingEmployee || !editingDate || !startTime || !endTime) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill out all required fields.',
      })
      return
    }
    setModalLoading(true)
    try {
      const scheduleId = await getOrCreateScheduleId()
      const startDateTime =
        format(editingDate, 'yyyy-MM-dd') + 'T' + startTime + ':00'
      const endDateTime =
        format(editingDate, 'yyyy-MM-dd') + 'T' + endTime + ':00'

      if (editingShift) {
        const { data, error } = await supabase
          .from('shifts')
          .update({
            start_time: startDateTime,
            end_time: endDateTime,
            notes,
          })
          .eq('id', editingShift.id)
          .select()

        if (error) throw error

        setShifts((prevShifts) =>
          prevShifts.map((s) =>
            s.id === editingShift.id
              ? {
                  ...s,
                  start_time: startDateTime,
                  end_time: endDateTime,
                  notes,
                }
              : s
          )
        )

        toast({ title: 'Shift updated!' })
      } else {
        const { data, error } = await supabase
          .from('shifts')
          .insert({
            schedule_id: scheduleId,
            employee_id: editingEmployee.id,
            start_time: startDateTime,
            end_time: endDateTime,
            notes,
          })
          .select()

        if (error) throw error

        if (data && data.length > 0) {
          setShifts((prevShifts) => [...prevShifts, data[0]])
        }

        toast({ title: 'Shift added!' })
      }

      closeShiftModal()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Please try again.'
      toast({
        variant: 'destructive',
        title: 'Error saving shift',
        description: errorMessage,
      })
    } finally {
      setModalLoading(false)
    }
  }

  async function handleDeleteShift() {
    if (!editingShift) return
    setModalLoading(true)
    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', editingShift.id)
      if (error) throw error

      setShifts((prevShifts) =>
        prevShifts.filter((s) => s.id !== editingShift.id)
      )

      toast({ title: 'Shift deleted!' })
      closeShiftModal()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Please try again.'
      toast({
        variant: 'destructive',
        title: 'Error deleting shift',
        description: errorMessage,
      })
    } finally {
      setModalLoading(false)
    }
  }

  const memoizedEmployees = useMemo(() => employees, [employees])
  const memoizedShifts = useMemo(() => shifts, [shifts])
  const memoizedWeekDates = useMemo(() => weekDates, [weekDates])

  const fetchAvailabilities = useCallback(async () => {
    if (!showAvailabilities || !storeId) return

    setIsLoadingAvailabilities(true)
    try {
      const weekStart = format(startOfWeek(currentWeek), 'yyyy-MM-dd')
      const weekEnd = format(endOfWeek(currentWeek), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', weekStart)
        .lte('date', weekEnd)

      if (error) throw error
      setAvailabilities(data || [])
    } catch (error) {
      console.error('Error fetching availabilities:', error)
      toast({
        variant: 'destructive',
        title: 'Error loading availabilities',
        description: 'Please try again',
      })
    } finally {
      setIsLoadingAvailabilities(false)
    }
  }, [supabase, storeId, currentWeek, showAvailabilities])

  useEffect(() => {
    fetchAvailabilities()
  }, [fetchAvailabilities])

  const handleToggleAvailabilities = useCallback(() => {
    setShowAvailabilities((prev) => !prev)
  }, [])

  if (loading) {
    return <ScheduleSkeleton />
  }

  if (!isManager && !isEmployee) {
    return (
      <div className='container mx-auto px-4 py-6 max-w-6xl'>
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have access to view this store&apos;s schedule
              information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6'>
        <h1 className='text-2xl font-semibold'>
          {storeName}{' '}
          <span className='text-muted-foreground font-normal'>Schedule</span>
        </h1>
      </div>

      <WeekNavigation
        currentWeek={currentWeek}
        weekDates={weekDates}
        onWeekChange={setCurrentWeek}
      />

      <div className='flex justify-end gap-2'>
        <AvailabilityToggle
          showAvailabilities={showAvailabilities}
          onToggle={handleToggleAvailabilities}
        />

        {isManager && isManagerView && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchData()}
            className='flex items-center gap-1'
          >
            <RefreshCcw className='h-3.5 w-3.5' />
            Refresh
          </Button>
        )}
      </div>

      {showAvailabilities &&
        (isLoadingAvailabilities ? (
          <div className='h-[300px] w-full flex items-center justify-center'>
            <div className='animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full'></div>
          </div>
        ) : (
          <AvailabilityViewer
            employees={memoizedEmployees}
            availabilities={availabilities}
          />
        ))}

      <Card>
        <CardHeader className='py-4'>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>View all shifts for {storeName}</CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleTable
            employees={memoizedEmployees}
            shifts={memoizedShifts}
            weekDates={memoizedWeekDates}
            viewOnly={!isManagerView}
            onShiftClick={isManagerView ? handleShiftClick : undefined}
          />
        </CardContent>
      </Card>

      <Dialog open={shiftModalOpen} onOpenChange={setShiftModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingShift ? 'Edit Shift' : 'Add Shift'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <div className='font-medium'>Employee</div>
              <div>{editingEmployee?.full_name}</div>
            </div>
            <div>
              <div className='font-medium'>Date</div>
              <div>{editingDate ? format(editingDate, 'PPP') : ''}</div>
            </div>
            <div>
              <label className='block font-medium mb-1'>Start Time</label>
              <Input
                type='time'
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={modalLoading}
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>End Time</label>
              <Input
                type='time'
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={modalLoading}
              />
            </div>
            <div>
              <label className='block font-medium mb-1'>Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={modalLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={closeShiftModal}
              disabled={modalLoading}
            >
              Cancel
            </Button>
            {editingShift && (
              <Button
                variant='destructive'
                onClick={handleDeleteShift}
                disabled={modalLoading}
              >
                Delete
              </Button>
            )}
            <Button onClick={handleSaveShift} disabled={modalLoading}>
              {modalLoading
                ? editingShift
                  ? 'Saving...'
                  : 'Adding...'
                : editingShift
                ? 'Save Changes'
                : 'Add Shift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
