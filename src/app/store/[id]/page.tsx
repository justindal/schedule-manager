'use client'

import { createClientBrowser } from '@/app/utils/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Edit, Plus, Save, Trash, Users, Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Loader2, Copy, User } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

const REFRESH_INTERVAL_MS = 10000

const showError = (title: string, description: string) => {
  toast({
    title,
    description,
    variant: 'destructive',
  })
}

const showSuccess = (title: string, description: string) => {
  toast({
    title,
    description,
  })
}

interface StoreDetails {
  id: string
  name: string
  address: string
  phone_number: string
  join_code: string
}

interface Manager {
  id: string
  full_name: string
  email: string
  is_primary: boolean
}

interface Employee {
  id: string
  full_name: string
  email: string
  isRejectedManager?: boolean
}

interface ManagerQueryResult {
  id: string
  full_name: string
  email: string
  store_managers: { is_primary: boolean }[]
}

interface NewPersonDialogProps {
  onAddPerson: (email: string, role: 'manager' | 'employee') => void
}

function NewPersonDialog({ onAddPerson }: NewPersonDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email) {
      onAddPerson(email, 'employee')
      setEmail('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Employee</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Employee to Store</DialogTitle>
          <DialogDescription>
            Add a person as an employee by their email address
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='person@example.com'
                required
              />
            </div>
          </div>
          <DialogFooter className='mt-4'>
            <Button type='submit'>Add Employee</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StoreDetailSkeleton() {
  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
        <Skeleton className='h-8 w-64' />
        <div className='flex flex-wrap gap-2'>
          <Skeleton className='h-10 w-48' />
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-32' />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='col-span-1 md:col-span-2'>
          <Skeleton className='h-24 w-full' />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32 mb-2' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex gap-2'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-4 w-full' />
              </div>
              <div className='flex gap-2'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-4 w-full' />
              </div>
              <div className='flex gap-2'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-4 w-32' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className='flex items-center justify-between p-3 border rounded-md'
                >
                  <div>
                    <Skeleton className='h-5 w-40 mb-2' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                  <Skeleton className='h-8 w-24' />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='flex items-center justify-between p-3 border rounded-md'
                >
                  <div>
                    <Skeleton className='h-5 w-40 mb-2' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                  <Skeleton className='h-8 w-8' />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function StoreDetail() {
  const params = useParams()
  const storeId = params.id as string
  const router = useRouter()
  const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null)
  const [managers, setManagers] = useState<Manager[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEmployee, setIsEmployee] = useState(false)
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(false)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [isSelfPrimaryManager, setIsSelfPrimaryManager] = useState(false)
  const [isApprovedManager, setIsApprovedManager] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClientBrowser()

  useEffect(() => {
    loadStoreData()
    checkUserRole()
    loadManagersAndEmployees()
  }, [])

  async function checkUserRole() {
    try {
      const { data: userData } = await supabase.auth.getUser()
      setCurrentUserId(userData.user?.id ?? null)
      if (!userData.user) return

      const { data: managerData } = await supabase
        .from('store_managers')
        .select('is_primary')
        .eq('store_id', storeId)
        .eq('manager_id', userData.user.id)
        .maybeSingle()

      setIsApprovedManager(!!managerData)
      setIsSelfPrimaryManager(managerData?.is_primary || false)

      const { data: employeeData } = await supabase
        .from('store_employees')
        .select('*')
        .eq('store_id', storeId)
        .eq('employee_id', userData.user.id)
        .maybeSingle()

      setIsEmployee(!!employeeData)
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  async function loadStoreData() {
    try {
      setLoading(true)
      const { data: storeData, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single()

      if (error) throw error
      setStoreDetails(storeData)

      await loadManagersAndEmployees()
    } catch (error) {
      console.error('Error loading store data:', error)
      showError('Error', 'Failed to load store data')
    } finally {
      setLoading(false)
    }
  }

  async function loadManagersAndEmployees() {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: managerData } = (await supabase
        .from('profiles')
        .select(
          `
          id,
          full_name,
          email,
          store_managers!inner (
            is_primary
          )
        `
        )
        .eq('store_managers.store_id', storeId)) as {
        data: ManagerQueryResult[] | null
      }

      // Get employee data
      const { data: employeeData } = await supabase
        .from('store_employees')
        .select('employee_id')
        .eq('store_id', storeId)

      const employeeIds = employeeData?.map((e) => e.employee_id) || []
      const managerIds = managerData?.map((m) => m.id) || []

      const allPeopleIds = [...new Set([...employeeIds, ...managerIds])]
      console.log(
        'DEBUG all people IDs:',
        JSON.stringify(allPeopleIds, null, 2)
      )

      let allProfiles: {
        id: string
        full_name: string
        email: string
      }[] = []

      if (allPeopleIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', allPeopleIds)

        if (profileError) {
          console.error('Error fetching profiles:', profileError)
        } else {
          allProfiles = profileData || []
          console.log(
            'DEBUG all profiles:',
            JSON.stringify(allProfiles, null, 2)
          )
        }
      }

      const processedManagers: Manager[] =
        managerData?.map((manager) => ({
          id: manager.id,
          full_name: manager.full_name,
          email: manager.email,
          is_primary: manager.store_managers[0].is_primary,
        })) || []

      setManagers(processedManagers)

      const processedEmployees: Employee[] = employeeIds
        .map((employeeId) => {
          const profile = allProfiles.find((p) => p.id === employeeId)
          if (!profile) return null

          return {
            id: employeeId,
            full_name: profile.full_name,
            email: profile.email,
          }
        })
        .filter((e): e is Employee => e !== null)

      setEmployees(processedEmployees)

      const isPrimaryManager = processedManagers.some(
        (manager) => manager.id === user.user.id && manager.is_primary
      )
      setIsSelfPrimaryManager(isPrimaryManager)

      const isManager = processedManagers.some(
        (manager) => manager.id === user.user.id
      )
      setIsApprovedManager(isManager)
    } catch (error) {
      console.error('Error loading people data:', error)
    }
  }

  async function addSelfAsEmployee() {
    setIsLoadingEmployee(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        showError('Error', 'You must be logged in to join as an employee')
        return
      }

      const { error: checkError, data: existingData } = await supabase
        .from('store_employees')
        .select('*')
        .eq('store_id', storeId)
        .eq('employee_id', user.user.id)
        .maybeSingle()

      if (existingData) {
        showError('Already an Employee', 'You are already an employee here')
        return
      }

      const { error } = await supabase.from('store_employees').insert({
        store_id: storeId,
        employee_id: user.user.id,
      })

      if (error) throw error

      showSuccess('Success', 'You are now an employee of this store')
      setIsEmployee(true)
      await loadManagersAndEmployees()
    } catch (error) {
      console.error('Error adding self as employee:', error)
      showError('Error', 'Failed to add you as an employee')
    } finally {
      setIsLoadingEmployee(false)
    }
  }

  async function handleStoreUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isApprovedManager) return

    setIsSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const address = formData.get('address') as string
      const phone = formData.get('phone') as string

      const { error } = await supabase
        .from('stores')
        .update({
          name,
          address,
          phone_number: phone,
        })
        .eq('id', storeId)

      if (error) throw error

      showSuccess('Store Updated', 'Store details have been updated')
      setEditing(false)
      loadStoreData()
    } catch (error) {
      console.error('Error updating store:', error)
      showError('Update Failed', 'Failed to update store details')
    } finally {
      setIsSaving(false)
    }
  }

  async function addPerson(email: string, role: 'manager' | 'employee') {
    try {
      if (!isApprovedManager) return

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      if (userError || !userData) {
        showError(
          'User Not Found',
          'No user found with that email. They must register first.'
        )
        return
      }

      const { data: existingEmployee } = await supabase
        .from('store_employees')
        .select('*')
        .eq('store_id', storeId)
        .eq('employee_id', userData.id)
        .maybeSingle()

      if (existingEmployee) {
        showError('Already an Employee', 'This person is already an employee')
        return
      }

      const { error: employeeError } = await supabase
        .from('store_employees')
        .insert({
          store_id: storeId,
          employee_id: userData.id,
        })

      if (employeeError) throw employeeError
      showSuccess('Employee Added', 'The person is now an employee')

      loadManagersAndEmployees()
    } catch (error) {
      console.error('Error adding person:', error)
      showError('Error', 'Failed to add person to the store')
    }
  }

  async function removePerson(userId: string, role: 'manager' | 'employee') {
    try {
      if (!isApprovedManager) return

      const { data: user } = await supabase.auth.getUser()
      if (role === 'manager' && userId === user?.user?.id) {
        showError(
          'Cannot Remove Self',
          'You cannot remove yourself as a manager'
        )
        return
      }

      if (role === 'manager') {
        // First check if the manager is already an employee
        const { data: existingEmployee } = await supabase
          .from('store_employees')
          .select('*')
          .eq('store_id', storeId)
          .eq('employee_id', userId)
          .maybeSingle()

        // Delete from store_managers
        const { error: deleteError } = await supabase
          .from('store_managers')
          .delete()
          .eq('store_id', storeId)
          .eq('manager_id', userId)

        if (deleteError) throw deleteError

        // If they're not already an employee, add them to store_employees
        if (!existingEmployee) {
          const { error: insertError } = await supabase
            .from('store_employees')
            .insert({
              store_id: storeId,
              employee_id: userId,
            })

          if (insertError) throw insertError
          showSuccess('Manager Demoted', 'Manager has been demoted to employee')
        } else {
          showSuccess(
            'Manager Removed',
            'Manager has been removed from management'
          )
        }
      } else {
        const { error } = await supabase
          .from('store_employees')
          .delete()
          .eq('store_id', storeId)
          .eq('employee_id', userId)

        if (error) throw error
        showSuccess('Employee Removed', 'Employee has been removed')
      }

      loadManagersAndEmployees()
    } catch (error) {
      console.error('Error removing person:', error)
      showError('Error', 'Failed to remove person from the store')
    }
  }

  async function leaveStore() {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      if (isSelfPrimaryManager) {
        showError(
          'Cannot Leave',
          'You are the primary manager and cannot leave the store'
        )
        return
      }

      if (isApprovedManager || managers.some((m) => m.id === user.user?.id)) {
        const { error } = await supabase
          .from('store_managers')
          .delete()
          .eq('store_id', storeId)
          .eq('manager_id', user.user.id)

        if (error) throw error
      }

      if (isEmployee) {
        const { error } = await supabase
          .from('store_employees')
          .delete()
          .eq('store_id', storeId)
          .eq('employee_id', user.user.id)

        if (error) throw error
      }

      showSuccess('Left Store', 'You have left the store')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error leaving store:', error)
      showError('Error', 'Failed to leave the store')
    }
  }

  async function generateNewJoinCode() {
    try {
      if (!isApprovedManager) return
      setIsGeneratingCode(true)

      const newCode = Math.floor(100000 + Math.random() * 900000).toString()

      const { error } = await supabase
        .from('stores')
        .update({ join_code: newCode })
        .eq('id', storeId)

      if (error) throw error

      setStoreDetails((prev) => (prev ? { ...prev, join_code: newCode } : null))
      showSuccess('Code Generated', 'New join code has been generated')
    } catch (error) {
      console.error('Error generating join code:', error)
      showError('Error', 'Failed to generate new join code')
    } finally {
      setIsGeneratingCode(false)
    }
  }

  async function copyJoinCode() {
    if (storeDetails?.join_code) {
      try {
        await navigator.clipboard.writeText(storeDetails.join_code)
        showSuccess('Copied', 'Join code copied to clipboard')
      } catch (error) {
        console.error('Failed to copy text: ', error)
        showError('Error', 'Failed to copy join code')
      }
    }
  }

  async function makeEmployeeManager(
    employeeId: string,
    isPrimary: boolean = false
  ) {
    try {
      if (!isApprovedManager) return

      const { data: existingManager } = await supabase
        .from('store_managers')
        .select('*')
        .eq('store_id', storeId)
        .eq('manager_id', employeeId)
        .maybeSingle()

      if (existingManager) {
        showError('Already a Manager', 'This person is already a manager')
        return
      }

      const { error: managerError } = await supabase
        .from('store_managers')
        .insert({
          store_id: storeId,
          manager_id: employeeId,
          is_primary: isPrimary,
          status: 'approved',
        })

      if (managerError) throw managerError
      showSuccess('Manager Added', 'The employee has been made a manager')

      loadManagersAndEmployees()
    } catch (error) {
      console.error('Error making employee a manager:', error)
      showError('Error', 'Failed to update manager status')
    }
  }

  if (loading) {
    return <StoreDetailSkeleton />
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <h1 className='text-2xl font-semibold'>{storeDetails?.name}</h1>
        <div className='flex flex-wrap gap-2'>
          {!isApprovedManager && !isEmployee && (
            <Button onClick={addSelfAsEmployee} disabled={isLoadingEmployee}>
              {isLoadingEmployee ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Joining...
                </>
              ) : (
                'Join as Employee'
              )}
            </Button>
          )}
          {isApprovedManager && <NewPersonDialog onAddPerson={addPerson} />}
          {(isApprovedManager || isEmployee) && (
            <Button
              variant='outline'
              onClick={leaveStore}
              disabled={isSelfPrimaryManager}
            >
              Leave Store
            </Button>
          )}
        </div>
      </div>

      {(isApprovedManager || isEmployee) && (
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
              <Button asChild className='w-full'>
                <Link
                  href={`/store/${storeId}/schedule${
                    isApprovedManager ? '?manage=true' : ''
                  }`}
                >
                  <Calendar className='h-4 w-4 mr-2' />
                  {isApprovedManager ? 'Manage' : 'View'} Schedule
                </Link>
              </Button>
              {isApprovedManager && (
                <Button asChild className='w-full'>
                  <Link href={`/store/${storeId}/availability`}>
                    <Users className='h-4 w-4 mr-2' />
                    Team Availability
                  </Link>
                </Button>
              )}
              <Button asChild className='w-full'>
                <Link href={`/store/${storeId}/my-availability`}>
                  <Clock className='h-4 w-4 mr-2' />
                  My Availability
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <CardTitle>Store Details</CardTitle>
              {isApprovedManager && (
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setEditing(!editing)}
                >
                  <Edit className='h-4 w-4 mr-2' />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!editing ? (
              <div className='space-y-4'>
                <div>
                  <span className='font-semibold'>Address:</span>{' '}
                  {storeDetails?.address}
                </div>
                <div>
                  <span className='font-semibold'>Phone:</span>{' '}
                  {storeDetails?.phone_number}
                </div>
                {isApprovedManager && (
                  <div>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold'>Join Code:</span>{' '}
                      <code className='bg-muted px-2 py-1 rounded-md'>
                        {storeDetails?.join_code}
                      </code>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              onClick={copyJoinCode}
                            >
                              <Copy className='h-4 w-4' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy join code</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      className='mt-2'
                      onClick={generateNewJoinCode}
                      disabled={isGeneratingCode}
                    >
                      {isGeneratingCode ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Generating...
                        </>
                      ) : (
                        'Generate New Code'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleStoreUpdate}
                className='space-y-4'
                autoComplete='off'
              >
                <div className='space-y-2'>
                  <Label htmlFor='name'>Store Name</Label>
                  <Input
                    id='name'
                    name='name'
                    defaultValue={storeDetails?.name}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='address'>Address</Label>
                  <Input
                    id='address'
                    name='address'
                    defaultValue={storeDetails?.address}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone Number</Label>
                  <Input
                    id='phone'
                    name='phone'
                    defaultValue={storeDetails?.phone_number}
                    required
                  />
                </div>
                <div className='flex gap-2'>
                  <Button
                    type='submit'
                    disabled={isSaving}
                    className='inline-flex'
                  >
                    {isSaving && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {isApprovedManager && (
          <Card>
            <CardHeader>
              <CardTitle>Managers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {managers.length === 0 && (
                  <p className='text-muted-foreground text-sm'>
                    No managers yet
                  </p>
                )}
                {managers.map((manager) => (
                  <div
                    key={manager.id}
                    className='flex items-center justify-between p-3 border rounded-md'
                  >
                    <div>
                      <div className='font-medium flex items-center gap-2'>
                        {manager.full_name}
                        <div className='flex gap-1'>
                          {manager.is_primary && (
                            <Badge variant='outline'>Primary</Badge>
                          )}
                        </div>
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        {manager.email}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {isApprovedManager &&
                        manager.id !== currentUserId &&
                        (!manager.is_primary ||
                          (manager.is_primary && isSelfPrimaryManager)) && (
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => removePerson(manager.id, 'manager')}
                          >
                            Remove
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isApprovedManager && (
          <Card>
            <CardHeader>
              <CardTitle>Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {employees.length === 0 && (
                  <p className='text-muted-foreground text-sm'>
                    No employees yet
                  </p>
                )}
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className='flex items-center justify-between p-3 border rounded-md'
                  >
                    <div>
                      <div className='font-medium'>{employee.full_name}</div>
                      <div className='text-sm text-muted-foreground'>
                        {employee.email}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {!managers.some((m) => m.id === employee.id) &&
                        isSelfPrimaryManager && (
                          <Button
                            size='sm'
                            onClick={() => makeEmployeeManager(employee.id)}
                          >
                            Make Manager
                          </Button>
                        )}

                      {!managers.some((m) => m.id === employee.id) && (
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => removePerson(employee.id, 'employee')}
                        >
                          <Trash className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
