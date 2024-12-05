'use client'

import { createClient } from '@/app/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Edit, Plus, Save, Trash, Users } from 'lucide-react'
import { use } from 'react'

interface StoreDetails {
  id: string
  name: string
  address: string
  phone_number: string
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
}

interface ManagerQueryResult {
  id: string
  full_name: string
  email: string
  store_managers: { is_primary: boolean }[]
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

  useEffect(() => {
    loadStoreData()
  }, [id])

  async function loadStoreData() {
    const supabase = createClient()

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
        store_managers!inner(is_primary)
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
      .eq('role', 'employee')

    setStore(storeData)
    setManagers(
      managersData?.map((manager: ManagerQueryResult) => ({
        id: manager.id,
        full_name: manager.full_name,
        email: manager.email,
        is_primary: manager.store_managers[0].is_primary,
      })) || []
    )
    setEmployees(employeesData || [])
    setLoading(false)
  }

  async function handleStoreUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

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
    const supabase = createClient()

    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!user) {
      alert('User not found. The user must create an account first.')
      return
    }

    if (role === 'manager') {
      await supabase.from('store_managers').insert({
        store_id: id,
        manager_id: user.id,
        is_primary: false,
      })
    } else {
      await supabase.from('store_employees').insert({
        store_id: id,
        employee_id: user.id,
      })
    }

    setNewEmail('')
    loadStoreData()
  }

  async function leaveStore() {
    if (!confirm('Are you sure you want to leave this store?')) return

    const supabase = createClient()
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
      alert('Failed to leave store')
    }
  }

  if (loading) return <div>Loading...</div>
  if (!store) return <div>Store not found</div>

  return (
    <div className='container mx-auto py-8 space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-semibold'>Store Details</h1>
        <Button variant='destructive' onClick={leaveStore}>
          Leave Store
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle>Store Details</CardTitle>
            <Button variant='outline' onClick={() => setEditing(!editing)}>
              {editing ? (
                <Save className='h-4 w-4' />
              ) : (
                <Edit className='h-4 w-4' />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStoreUpdate} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Store Name</Label>
              <Input
                id='name'
                name='name'
                defaultValue={store.name}
                disabled={!editing}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='address'>Address</Label>
              <Input
                id='address'
                name='address'
                defaultValue={store.address}
                disabled={!editing}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number</Label>
              <Input
                id='phone'
                name='phone'
                defaultValue={store.phone_number}
                disabled={!editing}
              />
            </div>

            {editing && <Button type='submit'>Save Changes</Button>}
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue='managers'>
        <TabsList>
          <TabsTrigger value='managers'>Managers</TabsTrigger>
          <TabsTrigger value='employees'>Employees</TabsTrigger>
        </TabsList>

        <TabsContent value='managers' className='mt-4'>
          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>Store Managers</CardTitle>
                <div className='flex gap-2 items-center max-w-xs'>
                  <Input
                    placeholder='manager@email.com'
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className='h-8 w-[200px]'
                  />
                  <Button
                    size='sm'
                    onClick={() => addPerson(newEmail, 'manager')}
                  >
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {managers.map((manager) => (
                  <div
                    key={manager.id}
                    className='flex items-center justify-between'
                  >
                    <div>
                      <div>{manager.full_name}</div>
                      <div className='text-sm text-muted-foreground'>
                        {manager.email}
                      </div>
                    </div>
                    {manager.is_primary && (
                      <div className='text-sm text-primary'>
                        Primary Manager
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='employees' className='mt-4'>
          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>Store Employees</CardTitle>
                <div className='flex gap-2 items-center max-w-xs'>
                  <Input
                    placeholder='employee@email.com'
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className='h-8 w-[200px]'
                  />
                  <Button
                    size='sm'
                    onClick={() => addPerson(newEmail, 'employee')}
                  >
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className='flex items-center justify-between'
                  >
                    <div>
                      <div>{employee.full_name}</div>
                      <div className='text-sm text-muted-foreground'>
                        {employee.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
