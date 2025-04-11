'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Store, LogOut, Menu, Calendar, Clock, Home } from 'lucide-react'
import { signOut } from '@/app/actions/auth/login'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useState, useEffect } from 'react'

interface StoreData {
  id: string
  name: string
}

interface NavbarData {
  user: any
  employeeStores: Array<{
    stores: {
      id: string
      name: string
    }
  }>
}

export function EmployeeNavbar() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NavbarData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/user/navbar-data')
        if (!response.ok) {
          throw new Error('Failed to fetch navbar data')
        }
        const json = await response.json()
        setData(json)
      } catch (error) {
        console.error('Error loading navbar data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading || !data) {
    return (
      <nav className='border-b'>
        <div className='container mx-auto px-4 flex h-14 items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <span className='font-bold'>Employee Portal</span>
          </div>
        </div>
      </nav>
    )
  }

  const { user, employeeStores } = data

  return (
    <nav className='border-b'>
      <div className='container mx-auto px-4 flex h-14 items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Link href='/employee' className='font-bold'>
            Employee Portal
          </Link>
          <div className='hidden sm:flex items-center space-x-2'>
            <Button variant='ghost' asChild>
              <Link href='/employee'>
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
          <div className='sm:hidden'>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon'>
                  <Menu className='h-5 w-5' />
                </Button>
              </SheetTrigger>
              <SheetContent side='right'>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className='flex flex-col gap-3 mt-4'>
                  <div className='text-sm text-muted-foreground'>
                    {user?.email}
                  </div>

                  <div className='flex flex-col gap-1'>
                    <Button
                      variant='ghost'
                      asChild
                      className='justify-start h-10 px-2'
                      onClick={() => setOpen(false)}
                    >
                      <Link href='/employee'>
                        <Home className='w-4 h-4 mr-2' />
                        Home
                      </Link>
                    </Button>

                    <Button
                      variant='ghost'
                      asChild
                      className='justify-start h-10 px-2'
                      onClick={() => setOpen(false)}
                    >
                      <Link href='/employee'>
                        <Store className='w-4 h-4 mr-2' />
                        My Stores
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
                  </div>

                  <form action={signOut}>
                    <Button
                      variant='ghost'
                      className='w-full justify-start'
                      type='submit'
                      onClick={() => setOpen(false)}
                    >
                      <LogOut className='w-4 h-4 mr-2' />
                      Sign Out
                    </Button>
                  </form>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className='hidden sm:block'>
            <form action={signOut}>
              <Button variant='ghost' size='icon' type='submit'>
                <LogOut className='w-4 h-4' />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
