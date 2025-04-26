'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Store,
  LogOut,
  Menu,
  Calendar,
  Clock,
  Home,
  Settings,
} from 'lucide-react'
import { signOut } from '@/app/actions/auth/login'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useState, useEffect } from 'react'
import { createClientBrowser } from '@/app/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Skeleton } from '@/components/ui/skeleton'

interface StoreData {
  id: string
  name: string
}

interface StoreEmployee {
  stores: {
    id: string
    name: string
  }
}

function NavbarSkeleton() {
  return (
    <nav className='border-b'>
      <div className='container mx-auto px-4 flex h-14 items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Skeleton className='h-5 w-36' />
          <div className='hidden sm:flex items-center space-x-2'>
            <Skeleton className='h-10 w-32' />
          </div>
        </div>
        <div className='flex items-center space-x-4'>
          <Skeleton className='hidden sm:inline h-4 w-40' />
          <Skeleton className='h-10 w-10 sm:hidden' />
          <Skeleton className='hidden sm:inline h-10 w-24' />
        </div>
      </div>
    </nav>
  )
}

export function EmployeeNavbar() {
  const [open, setOpen] = useState(false)
  const [employeeStores, setEmployeeStores] = useState<StoreEmployee[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1)
  }

  useEffect(() => {
    window.addEventListener('focus', refreshData)

    return () => {
      window.removeEventListener('focus', refreshData)
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        setLoading(false)
        return
      }

      const { data: storeEmployees } = await supabase
        .from('store_employees')
        .select(
          `
          stores (
            id,
            name
          )
        `
        )
        .eq('employee_id', user?.id)

      console.log(
        'Store data structure:',
        JSON.stringify(storeEmployees, null, 2)
      )

      const typedStoreEmployees: StoreEmployee[] =
        storeEmployees?.map((item: unknown) => {
          const typedItem = item as { stores: { id: string; name: string } }
          return {
            stores: {
              id: typedItem.stores.id,
              name: typedItem.stores.name,
            },
          }
        }) || []

      setEmployeeStores(typedStoreEmployees)
      setLoading(false)
    }

    fetchData()
  }, [refreshKey])

  if (loading || !user) {
    return <NavbarSkeleton />
  }

  return (
    <nav className='border-b'>
      <div className='container mx-auto px-4 flex h-14 items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Link href='/employee' className='font-bold' onClick={refreshData}>
            Employee Portal
          </Link>
          <div className='hidden sm:flex items-center space-x-2'>
            <Button variant='ghost' asChild>
              <Link href='/employee' onClick={refreshData}>
                <Store className='w-4 h-4 mr-2' />
                My Stores
              </Link>
            </Button>
          </div>
        </div>
        <div className='flex items-center space-x-4'>
          <span className='hidden sm:inline text-sm text-muted-foreground'>
            {user?.email}
          </span>

          {/* Desktop settings link */}
          <div className='hidden sm:block'>
            <Button variant='ghost' size='sm' asChild>
              <Link href='/employee/settings'>
                <Settings className='w-4 h-4 mr-2' />
                Settings
              </Link>
            </Button>
          </div>

          <div className='sm:hidden'>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon'>
                  <Menu className='h-5 w-5' />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className='mt-4 space-y-4'>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    asChild
                    onClick={() => {
                      setOpen(false)
                      refreshData()
                    }}
                  >
                    <Link href='/employee'>
                      <Home className='w-4 h-4 mr-2' />
                      Dashboard
                    </Link>
                  </Button>

                  {/* Mobile Settings Link */}
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link href='/employee/settings'>
                      <Settings className='w-4 h-4 mr-2' />
                      Settings
                    </Link>
                  </Button>

                  {employeeStores && employeeStores.length > 0 && (
                    <div className='ml-4 pl-2 border-l mt-2 space-y-1'>
                      {employeeStores.map((item) => (
                        <div
                          key={item.stores.id}
                          className='flex flex-col gap-1'
                        >
                          <span className='text-sm font-medium pt-1'>
                            {item.stores.name}
                          </span>
                          <div className='flex gap-2 ml-1'>
                            <Button
                              variant='ghost'
                              size='sm'
                              asChild
                              className='h-8 justify-start text-xs'
                              onClick={() => setOpen(false)}
                            >
                              <Link
                                href={`/employee/store/${item.stores.id}/schedule`}
                              >
                                <Calendar className='w-3 h-3 mr-1.5' />
                                Schedule
                              </Link>
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              asChild
                              className='h-8 justify-start text-xs'
                              onClick={() => setOpen(false)}
                            >
                              <Link
                                href={`/employee/store/${item.stores.id}/availability`}
                              >
                                <Clock className='w-3 h-3 mr-1.5' />
                                Availability
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    variant='ghost'
                    className='w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-100'
                    onClick={() => {
                      signOut()
                      setOpen(false)
                    }}
                  >
                    <LogOut className='w-4 h-4 mr-2' />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className='hidden sm:block'>
            <Button
              variant='ghost'
              className='text-red-600 hover:text-red-600 hover:bg-red-100'
              onClick={() => signOut()}
            >
              <LogOut className='w-4 h-4 mr-2' />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
