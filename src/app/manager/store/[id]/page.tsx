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
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Edit, Plus, Save, Trash, Users } from 'lucide-react'
import { use } from 'react'
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
  status: string
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
  store_managers: { is_primary: boolean; status: string }[]
}

interface NewPersonDialogProps {
  onAddPerson: (email: string, role: 'manager' | 'employee') => void
}

function NewPersonDialog({ onAddPerson }: NewPersonDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'manager' | 'employee'>('employee')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email) {
      onAddPerson(email, role)
      setEmail('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Person</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Person to Store</DialogTitle>
          <DialogDescription>
            Add a person as a manager or employee by their email address
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
            <div className='space-y-2'>
              <Label htmlFor='role'>Role</Label>
              <Select
                value={role}
                onValueChange={(value: 'manager' | 'employee') =>
                  setRole(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='manager'>Manager</SelectItem>
                  <SelectItem value='employee'>Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className='mt-4'>
            <Button type='submit'>Add</Button>
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

export default function StoreDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [store, setStore] = useState<StoreDetails | null>(null)
  const [managers, setManagers] = useState<Manager[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  const [addingSelf, setAddingSelf] = useState(false)
  const [isSelfEmployee, setIsSelfEmployee] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    loadStoreData()
    checkSelfEmployeeStatus()

    const refreshInterval = setInterval(() => {
      loadStoreData()
      checkSelfEmployeeStatus()
    }, REFRESH_INTERVAL_MS)

    return () => {
      clearInterval(refreshInterval)
    }
  }, [id])

  async function loadStoreData() {
    const supabase = createClientBrowser()

    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single()

    const { data: managersData } = await supabase
      .from('profiles')
      .select(
        `
        id,
        full_name,
        email,
        store_managers!inner(is_primary, status)
      `
      )
      .eq('store_managers.store_id', id)

    const { data: employeesData } = await supabase
      .from('profiles')
      .select(
        `
        id,
        full_name,
        email,
        store_employees!inner(store_id)
      `
      )
      .eq('store_employees.store_id', id)

    const managerList =
      managersData?.map((manager: ManagerQueryResult) => ({
        id: manager.id,
        full_name: manager.full_name,
        email: manager.email,
        is_primary: manager.store_managers[0].is_primary,
        status: manager.store_managers[0].status,
      })) || []

    setManagers(managerList)
    setStore(storeData)

    const approvedManagerIds = new Set(
      managerList.filter((m) => m.status === 'approved').map((m) => m.id)
    )

    const rejectedManagerIds = new Set(
      managerList.filter((m) => m.status === 'rejected').map((m) => m.id)
    )

    const enhancedEmployeeData = employeesData?.map((emp) => ({
      ...emp,
      isRejectedManager: rejectedManagerIds.has(emp.id),
    }))

    setEmployees(
      enhancedEmployeeData?.filter((emp) => !approvedManagerIds.has(emp.id)) ||
        []
    )
    setLoading(false)
  }

  async function checkSelfEmployeeStatus() {
    const supabase = createClientBrowser()
    const user = (await supabase.auth.getUser()).data.user

    if (!user) return

    const { data } = await supabase
      .from('store_employees')
      .select('*')
      .eq('store_id', id)
      .eq('employee_id', user.id)
      .maybeSingle()

    setIsSelfEmployee(!!data)
  }

  async function addSelfAsEmployee() {
    setAddingSelf(true)
    const supabase = createClientBrowser()
    const user = (await supabase.auth.getUser()).data.user

    try {
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('store_employees').insert({
        store_id: id,
        employee_id: user.id,
      })

      if (error) {
        if (error.message.includes('duplicate')) {
          showError(
            'Already an Employee',
            'You are already an employee of this store'
          )
        } else {
          showError('Error', `Failed to add employee access: ${error.message}`)
        }
      } else {
        showSuccess('Success', 'You now have employee access to this store')
        await checkSelfEmployeeStatus()
        loadStoreData()
      }
    } catch (error) {
      console.error('Error adding self as employee:', error)
      showError('Error', 'An unexpected error occurred')
    } finally {
      setAddingSelf(false)
    }
  }

  async function handleStoreUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const supabase = createClientBrowser()

    await supabase
      .from('stores')
      .update({
        name: formData.get('name'),
        address: formData.get('address'),
        phone_number: formData.get('phone'),
      })
      .eq('id', id)

    setEditing(false)
    loadStoreData()
  }

  async function addPerson(email: string, role: 'manager' | 'employee') {
    const supabase = createClientBrowser()

    try {
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (userError || !user) {
        showError('User Not Found', 'The user must create an account first.')
        return
      }

      let error
      if (role === 'manager') {
        const { error: managerError } = await supabase
          .from('store_managers')
          .insert({
            store_id: id,
            manager_id: user.id,
            is_primary: false,
            status: 'pending',
          })
        error = managerError
      } else {
        const { error: employeeError } = await supabase
          .from('store_employees')
          .insert({
            store_id: id,
            employee_id: user.id,
          })
        error = employeeError
      }

      if (error) {
        if (error.message.includes('duplicate')) {
          showError(
            'Already Added',
            `This person is already a ${role} of this store.`
          )
        } else {
          showError('Error', `Failed to add ${role}: ${error.message}`)
        }
        return
      }

      showSuccess(
        'Success',
        `${role.charAt(0).toUpperCase() + role.slice(1)} added successfully`
      )
      setNewEmail('')
      loadStoreData()
    } catch (error) {
      console.error(`Error adding ${role}:`, error)
      showError('Error', `Failed to add ${role}`)
    }
  }

  async function removePerson(userId: string, role: 'manager' | 'employee') {
    try {
      setRemoving(userId)
      const supabase = createClientBrowser()

      if (role === 'manager') {
        const { error } = await supabase
          .from('store_managers')
          .delete()
          .eq('store_id', id)
          .eq('manager_id', userId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('store_employees')
          .delete()
          .eq('store_id', id)
          .eq('employee_id', userId)

        if (error) throw error
      }

      showSuccess(
        'Success',
        `${role.charAt(0).toUpperCase() + role.slice(1)} removed successfully`
      )
      loadStoreData()
    } catch (error) {
      console.error(`Error removing ${role}:`, error)
      showError('Error', `Failed to remove ${role}`)
    } finally {
      setRemoving(null)
    }
  }

  async function leaveStore() {
    if (!confirm('Are you sure you want to leave this store?')) return

    const supabase = createClientBrowser()
    const user = (await supabase.auth.getUser()).data.user

    try {
      await supabase
        .from('store_managers')
        .delete()
        .eq('store_id', id)
        .eq('manager_id', user?.id)

      await supabase
        .from('store_employees')
        .delete()
        .eq('store_id', id)
        .eq('employee_id', user?.id)

      router.push('/manager')
    } catch (error) {
      console.error('Error leaving store:', error)
      showError('Error', 'Failed to leave store')
    }
  }

  async function handleManagerRequest(
    managerId: string,
    action: 'approve' | 'reject'
  ) {
    const supabase = createClientBrowser()

    try {
      const { error } = await supabase
        .from('store_managers')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('store_id', id)
        .eq('manager_id', managerId)

      if (error) {
        showError('Error', `Failed to ${action} manager request`)
        return
      }

      showSuccess('Success', `Manager request ${action}d successfully`)
      loadStoreData()
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      showError('Error', `Failed to ${action} manager request`)
    }
  }

  async function generateNewJoinCode() {
    setJoining(true)
    const supabase = createClientBrowser()

    try {
      const { data: joinCode, error: joinCodeError } = await supabase.rpc(
        'generate_store_join_code'
      )

      if (joinCodeError) {
        console.error('Error generating join code:', joinCodeError)
        toast({
          title: 'Error',
          description: 'Failed to generate join code',
          variant: 'destructive',
        })
        setJoining(false)
        return
      }

      console.log('Generated join code:', joinCode)

      const { data: updatedStore, error: updateError } = await supabase
        .from('stores')
        .update({ join_code: joinCode })
        .eq('id', id)
        .select('join_code')
        .single()

      if (updateError) {
        console.error('Error updating store with new join code:', updateError)
        toast({
          title: 'Error',
          description: 'Failed to update store with new join code',
          variant: 'destructive',
        })
        setJoining(false)
        return
      }

      toast({
        title: 'Success',
        description: 'New join code generated successfully',
      })
      loadStoreData()
    } catch (error) {
      console.error('Unexpected error generating new join code:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setJoining(false)
    }
  }

  async function reapproveManager(employeeId: string) {
    const supabase = createClientBrowser()

    try {
      const { data: existingManager } = await supabase
        .from('store_managers')
        .select('*')
        .eq('store_id', id)
        .eq('manager_id', employeeId)
        .single()

      if (existingManager) {
        const { error } = await supabase
          .from('store_managers')
          .update({ status: 'approved' })
          .eq('store_id', id)
          .eq('manager_id', employeeId)

        if (error) throw error
      } else {
        const { error } = await supabase.from('store_managers').insert({
          store_id: id,
          manager_id: employeeId,
          status: 'approved',
          is_primary: false,
        })

        if (error) throw error
      }

      toast({
        title: 'Success',
        description: 'Manager access approved',
      })

      loadStoreData()
    } catch (error) {
      console.error('Error approving manager:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve manager access',
        variant: 'destructive',
      })
    }
  }

  if (loading) return <StoreDetailSkeleton />
  if (!store) return <div>Store not found</div>

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
        <h1 className='text-2xl font-semibold'>{store.name}</h1>
        <div className='flex flex-wrap gap-2'>
          <Button onClick={generateNewJoinCode} disabled={joining}>
            {joining ? 'Generating...' : 'Generate New Join Code'}
          </Button>
          <NewPersonDialog
            onAddPerson={(email, role) => addPerson(email, role)}
          />
          <Button variant='outline' onClick={leaveStore}>
            Leave Store
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Notification for pending manager requests */}
        {managers.filter((m) => m.status === 'pending').length > 0 && (
          <div className='col-span-1 md:col-span-2 bg-amber-50 border-amber-200 border rounded-md p-4 flex gap-4 items-center'>
            <div className='bg-amber-100 p-2 rounded-full'>
              <User className='h-5 w-5 text-amber-600' />
            </div>
            <div>
              <h3 className='font-medium text-amber-800'>
                Manager Requests Pending
              </h3>
              <p className='text-sm text-amber-700'>
                {managers.filter((m) => m.status === 'pending').length} new
                manager{' '}
                {managers.filter((m) => m.status === 'pending').length === 1
                  ? 'request'
                  : 'requests'}{' '}
                waiting for your approval. These users currently have
                employee-level access only.
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Store Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className='grid grid-cols-4 gap-2'>
              <dt className='text-sm font-medium col-span-1'>Address:</dt>
              <dd className='text-sm col-span-3'>{store.address}</dd>
              <dt className='text-sm font-medium col-span-1'>Phone:</dt>
              <dd className='text-sm col-span-3'>{store.phone_number}</dd>
              <dt className='text-sm font-medium col-span-1'>Join Code:</dt>
              <dd className='flex items-center space-x-2 col-span-3'>
                <code className='text-sm bg-muted p-1 rounded'>
                  {store.join_code}
                </code>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        onClick={() => {
                          navigator.clipboard.writeText(store.join_code)
                          toast({
                            title: 'Copied!',
                            description: 'Join code copied to clipboard',
                          })
                        }}
                      >
                        <Copy className='h-3.5 w-3.5' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy to clipboard</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </dd>
            </dl>
          </CardContent>
        </Card>

        {/* Pending Manager Requests */}
        {managers.filter((m) => m.status === 'pending').length > 0 && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>Pending Manager Requests</CardTitle>
              <CardDescription>
                Review and approve manager requests. Pending managers currently
                have employee-level access only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {managers
                  .filter((m) => m.status === 'pending')
                  .map((manager) => (
                    <div
                      key={manager.id}
                      className='flex items-center justify-between p-3 border rounded-md'
                    >
                      <div>
                        <div className='font-medium'>{manager.full_name}</div>
                        <div className='text-sm text-muted-foreground'>
                          {manager.email}
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='text-green-600 border-green-600 hover:bg-green-50'
                          onClick={() =>
                            handleManagerRequest(manager.id, 'approve')
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='text-red-600 border-red-600 hover:bg-red-50'
                          onClick={() =>
                            handleManagerRequest(manager.id, 'reject')
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {managers
                .filter((m) => m.status === 'approved')
                .map((manager) => (
                  <div
                    key={manager.id}
                    className='flex items-center justify-between p-3 border rounded-md'
                  >
                    <div>
                      <div className='font-medium'>{manager.full_name}</div>
                      <div className='text-sm text-muted-foreground'>
                        {manager.email}
                      </div>
                    </div>
                    {!manager.is_primary && (
                      <Button
                        size='sm'
                        variant='ghost'
                        className='text-red-600 hover:text-red-600 hover:bg-red-100'
                        onClick={() => removePerson(manager.id, 'manager')}
                        disabled={removing === manager.id}
                      >
                        {removing === manager.id ? (
                          <Loader2 className='h-4 w-4 animate-spin' />
                        ) : (
                          'Remove'
                        )}
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className='flex items-center justify-between p-3 border rounded-md'
                >
                  <div>
                    <div className='flex items-center gap-2'>
                      <span>{employee.full_name}</span>
                      {employee.isRejectedManager && (
                        <Badge
                          variant='outline'
                          className='text-xs bg-red-50 text-red-600 border-red-200'
                        >
                          Manager Request Rejected
                        </Badge>
                      )}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {employee.email}
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    {employee.isRejectedManager && (
                      <Button
                        size='sm'
                        variant='outline'
                        className='text-green-600 border-green-600 hover:bg-green-50'
                        onClick={() => reapproveManager(employee.id)}
                      >
                        Approve as Manager
                      </Button>
                    )}
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removePerson(employee.id, 'employee')}
                      disabled={removing === employee.id}
                    >
                      <Trash className='h-4 w-4 text-destructive' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
