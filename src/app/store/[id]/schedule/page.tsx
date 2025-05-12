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
import { flushSync } from 'react-dom'
import React, { Suspense, memo } from 'react'

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

function processShiftsWithDeletedEmployees(rawShifts: Shift[]) {
  if (!rawShifts || rawShifts.length === 0)
    return { processedShifts: [], virtualEmployees: [] }

  const deletedUserShifts = rawShifts.filter(
    (shift) => shift.employee_id === null && shift.original_employee_name
  )

  if (deletedUserShifts.length === 0) {
    return { processedShifts: rawShifts, virtualEmployees: [] }
  }

  const deletedUserMap = new Map<string, string>()

  deletedUserShifts.forEach((shift) => {
    if (shift.original_employee_name) {
      const virtualId = `deleted-${shift.original_employee_name
        .replace(/\s+/g, '-')
        .toLowerCase()}`
      deletedUserMap.set(virtualId, shift.original_employee_name)
    }
  })

  const virtualEmployees = Array.from(deletedUserMap.entries()).map(
    ([virtualId, originalName]) => {
      return {
        id: virtualId,
        full_name: originalName,
        is_manager: false,
      }
    }
  )

  const processedShifts = rawShifts.map((shift) => {
    if (shift.employee_id === null && shift.original_employee_name) {
      const virtualId = `deleted-${shift.original_employee_name
        .replace(/\s+/g, '-')
        .toLowerCase()}`
      return {
        ...shift,
        employee_id: virtualId,
      }
    }
    return shift
  })

  return { processedShifts, virtualEmployees }
}

const MemoizedScheduleSection = memo(function ScheduleSection({
  storeName,
  employees,
  shifts,
  weekDates,
  isManagerView,
  handleShiftClick,
}: {
  storeName: string
  employees: Employee[]
  shifts: Shift[]
  weekDates: Date[]
  isManagerView: boolean
  handleShiftClick: (data: {
    employeeId: string
    date: Date
    shift?: Shift
  }) => void
}) {
  return (
    <Card>
      <CardHeader className='py-4'>
        <CardTitle>Weekly Schedule</CardTitle>
        <CardDescription>View all shifts for {storeName}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScheduleTable
          employees={employees}
          shifts={shifts}
          weekDates={weekDates}
          viewOnly={!isManagerView}
          onShiftClick={isManagerView ? handleShiftClick : undefined}
        />
      </CardContent>
    </Card>
  )
})

const MemoizedWeekNavigation = memo(function WeekNavigationSection({
  currentWeek,
  weekDates,
  onWeekChange,
  isManager,
  isManagerView,
  showAvailabilities,
  onToggleAvailabilities,
  onRefresh,
}: {
  currentWeek: Date
  weekDates: Date[]
  onWeekChange: (date: Date) => void
  isManager: boolean
  isManagerView: boolean
  showAvailabilities: boolean
  onToggleAvailabilities: () => void
  onRefresh: () => void
}) {
  return (
    <>
      <WeekNavigation
        currentWeek={currentWeek}
        weekDates={weekDates}
        onWeekChange={onWeekChange}
      />

      <div className='flex justify-end gap-2 mt-4'>
        <AvailabilityToggle
          showAvailabilities={showAvailabilities}
          onToggle={onToggleAvailabilities}
        />

        {isManager && isManagerView && (
          <Button
            variant='outline'
            size='sm'
            onClick={onRefresh}
            className='flex items-center gap-1'
          >
            <RefreshCcw className='h-3.5 w-3.5' />
            Refresh
          </Button>
        )}
      </div>
    </>
  )
})

const MemoizedAvailabilitySection = memo(function AvailabilitySection({
  showAvailabilities,
  isLoadingAvailabilities,
  employees,
  availabilities,
}: {
  showAvailabilities: boolean
  isLoadingAvailabilities: boolean
  employees: Employee[]
  availabilities: AvailabilityData[]
}) {
  if (!showAvailabilities) return null

  return isLoadingAvailabilities ? (
    <div className='h-[300px] w-full flex items-center justify-center'>
      <div className='animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full'></div>
    </div>
  ) : (
    <AvailabilityViewer employees={employees} availabilities={availabilities} />
  )
})

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
  const virtualEmployeesRef = useRef<Employee[]>([])
  const [dataProcessed, setDataProcessed] = useState(false)
  const [formerEmployees, setFormerEmployees] = useState<Employee[]>([])
  const dataProcessingRef = useRef<boolean>(false)
  const forceRenderRef = useRef<number>(0)
  const [isReady, setIsReady] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [weekChangeLoading, setWeekChangeLoading] = useState(false)

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
  }, [])

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
      return { isManager: false, isEmployee: false }
    }
  }, [supabase, storeId])

  const forceUpdate = useCallback(() => {
    forceRenderRef.current += 1
    setDataProcessed(true)
  }, [])

  const fetchData = useCallback(async () => {
    if (dataProcessingRef.current) {
      return
    }

    dataProcessingRef.current = true

    if (initialLoad) {
      setLoading(true)
      setDataProcessed(false)
      setIsReady(false)
    } else {
      setWeekChangeLoading(true)
    }

    setFormerEmployees([])

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You must be logged in to view this page',
        })
        setLoading(false)
        setWeekChangeLoading(false)
        dataProcessingRef.current = false
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

      let processedShifts: Shift[] = []
      let virtualEmployees: Employee[] = []

      if (scheduleData) {
        const { data: shiftData } = await supabase
          .from('shifts')
          .select('*')
          .eq('schedule_id', scheduleData.id)

        if (shiftData && shiftData.length > 0) {
          const result = processShiftsWithDeletedEmployees(shiftData)
          processedShifts = result.processedShifts
          virtualEmployees = result.virtualEmployees

          if (virtualEmployees.length > 0) {
            setFormerEmployees(virtualEmployees)
          } else {
            setFormerEmployees([])
          }
        } else {
          setFormerEmployees([])
        }

        setShifts(processedShifts)
      } else {
        setShifts([])
        setFormerEmployees([])
      }

      if (initialLoad) {
        await checkUserRole()
      }

      if (isManager && isManagerView) {
        const { data: employeeData } = await supabase
          .from('store_employees')
          .select('employee_id')
          .eq('store_id', storeId)

        const { data: managerData } = await supabase
          .from('store_managers')
          .select(`manager_id, is_primary`)
          .eq('store_id', storeId)

        const employeeIds = employeeData?.map((e) => e.employee_id) || []
        const managerIds = managerData?.map((m) => m.manager_id) || []

        const allPeopleIds = [...new Set([...employeeIds, ...managerIds])]

        interface ProfileData {
          id: string
          full_name: string
          email?: string
        }

        let allProfiles: ProfileData[] = []
        if (allPeopleIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', allPeopleIds)

          if (profileError) {
          } else {
            allProfiles = profileData || []
          }
        }

        const staffMap = new Map<string, Employee>()

        employeeIds.forEach((employeeId) => {
          const profile = allProfiles.find((p) => p.id === employeeId)
          staffMap.set(employeeId, {
            id: employeeId,
            full_name: profile?.full_name || 'Unknown Employee',
            is_manager: false,
          })
        })

        managerData?.forEach((manager) => {
          const profile = allProfiles.find((p) => p.id === manager.manager_id)
          if (staffMap.has(manager.manager_id)) {
            const existingEntry = staffMap.get(manager.manager_id)!
            existingEntry.is_manager = true
            if (profile?.full_name) {
              existingEntry.full_name = profile.full_name
            }
          } else {
            staffMap.set(manager.manager_id, {
              id: manager.manager_id,
              full_name: profile?.full_name || 'Unknown Manager',
              is_manager: true,
            })
          }
        })

        const employees = Array.from(staffMap.values())

        const finalEmployees = [
          ...employees.sort((a, b) => a.full_name.localeCompare(b.full_name)),
          ...virtualEmployees,
        ]

        setEmployees(finalEmployees)
      } else {
        const { data: employeeData } = await supabase
          .from('store_employees')
          .select('employee_id')
          .eq('store_id', storeId)

        let staffList: Employee[] = []

        if (employeeData && employeeData.length > 0) {
          const employeeIds = employeeData.map((e) => e.employee_id)

          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', employeeIds)

          staffList = employeeData.map((employee) => {
            const profile = profileData?.find(
              (p) => p.id === employee.employee_id
            )
            return {
              id: employee.employee_id,
              full_name: profile?.full_name || 'Unknown Employee',
              is_manager: false,
            }
          })
        }

        const finalEmployees = [
          ...staffList.sort((a, b) => a.full_name.localeCompare(b.full_name)),
          ...virtualEmployees,
        ]

        setEmployees(finalEmployees)
      }

      flushSync(() => {
        setDataProcessed(true)

        if (initialLoad) {
          setLoading(false)
          setIsReady(true)
          setInitialLoad(false)
        } else {
          setWeekChangeLoading(false)
        }
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading schedule data',
        description: 'Please try refreshing the page',
      })
      setShifts([])
      setEmployees([])
      setFormerEmployees([])
      flushSync(() => {
        setDataProcessed(true)

        if (initialLoad) {
          setLoading(false)
          setIsReady(true)
          setInitialLoad(false)
        } else {
          setWeekChangeLoading(false)
        }
      })
    } finally {
      dataProcessingRef.current = false
    }
  }, [
    supabase,
    storeId,
    storeName,
    currentWeek,
    checkUserRole,
    isManagerView,
    initialLoad,
    isManager,
  ])

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

  const memoizedEmployees = useMemo(() => employees, [employees])
  const memoizedShifts = useMemo(() => shifts, [shifts])
  const memoizedWeekDates = useMemo(() => weekDates, [weekDates])
  const memoizedStoreName = useMemo(() => storeName, [storeName])
  const memoizedIsManager = useMemo(() => isManager, [isManager])
  const memoizedIsManagerView = useMemo(() => isManagerView, [isManagerView])
  const memoizedAvailabilities = useMemo(() => availabilities, [availabilities])

  const handleWeekChange = useCallback((newWeek: Date) => {
    setCurrentWeek(newWeek)
  }, [])

  const handleRefresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const handleToggleAvailabilities = useCallback(() => {
    setShowAvailabilities((prev) => !prev)
  }, [])

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
      if (employeeId.startsWith('deleted-')) {
        if (shift) {
          toast({
            title: 'Former Employee',
            description:
              'This shift belongs to an employee who has deleted their account. The shift cannot be modified.',
          })
        }
        return
      }

      setEditingEmployee(
        memoizedEmployees.find((e) => e.id === employeeId) || null
      )
      setEditingDate(date)
      setEditingShift(shift || null)
      setShiftModalOpen(true)
    },
    [memoizedEmployees, toast]
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

  const WeekChangeLoadingIndicator = () => {
    if (!weekChangeLoading) return null

    return (
      <div className='fixed top-4 right-4 flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm'>
        <div className='animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full'></div>
        Loading...
      </div>
    )
  }

  if (!isReady) {
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
    <div className='container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6'>
      <WeekChangeLoadingIndicator />

      <div className='flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6'>
        <h1 className='text-xl sm:text-2xl font-semibold'>
          {memoizedStoreName}{' '}
          <span className='text-muted-foreground font-normal'>Schedule</span>
        </h1>
      </div>

      <div className='flex flex-col gap-2 sm:gap-0'>
        <MemoizedWeekNavigation
          currentWeek={currentWeek}
          weekDates={memoizedWeekDates}
          onWeekChange={handleWeekChange}
          isManager={memoizedIsManager}
          isManagerView={memoizedIsManagerView}
          showAvailabilities={showAvailabilities}
          onToggleAvailabilities={handleToggleAvailabilities}
          onRefresh={handleRefresh}
        />
      </div>

      <MemoizedAvailabilitySection
        showAvailabilities={showAvailabilities}
        isLoadingAvailabilities={isLoadingAvailabilities}
        employees={memoizedEmployees}
        availabilities={memoizedAvailabilities}
      />

      <div className='-mx-2 sm:mx-0 overflow-x-auto pb-2 sm:pb-0'>
        <div className='min-w-[400px] sm:min-w-0'>
          <MemoizedScheduleSection
            storeName={memoizedStoreName}
            employees={memoizedEmployees}
            shifts={memoizedShifts}
            weekDates={memoizedWeekDates}
            isManagerView={memoizedIsManagerView}
            handleShiftClick={handleShiftClick}
          />
        </div>
      </div>

      <Dialog open={shiftModalOpen} onOpenChange={setShiftModalOpen}>
        <DialogContent className='max-w-full w-[95vw] sm:w-[480px] p-4'>
          <DialogHeader>
            <DialogTitle className='text-lg sm:text-xl'>
              {editingShift ? 'Edit Shift' : 'Add Shift'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3 sm:space-y-4'>
            <div>
              <div className='font-medium text-sm sm:text-base'>Employee</div>
              <div className='text-sm sm:text-base'>
                {editingEmployee?.full_name}
              </div>
            </div>
            <div>
              <div className='font-medium text-sm sm:text-base'>Date</div>
              <div className='text-sm sm:text-base'>
                {editingDate ? format(editingDate, 'PPP') : ''}
              </div>
            </div>
            <div>
              <label className='block font-medium mb-1 text-sm sm:text-base'>
                Start Time
              </label>
              <Input
                type='time'
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={modalLoading}
                className='text-sm sm:text-base'
              />
            </div>
            <div>
              <label className='block font-medium mb-1 text-sm sm:text-base'>
                End Time
              </label>
              <Input
                type='time'
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={modalLoading}
                className='text-sm sm:text-base'
              />
            </div>
            <div>
              <label className='block font-medium mb-1 text-sm sm:text-base'>
                Notes
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={modalLoading}
                className='text-sm sm:text-base'
              />
            </div>
          </div>
          <DialogFooter className='flex flex-col sm:flex-row gap-2 sm:gap-0'>
            <Button
              variant='outline'
              onClick={closeShiftModal}
              disabled={modalLoading}
              className='w-full sm:w-auto'
            >
              Cancel
            </Button>
            {editingShift && (
              <Button
                variant='destructive'
                onClick={handleDeleteShift}
                disabled={modalLoading}
                className='w-full sm:w-auto'
              >
                Delete
              </Button>
            )}
            <Button
              onClick={handleSaveShift}
              disabled={modalLoading}
              className='w-full sm:w-auto'
            >
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
