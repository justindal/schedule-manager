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
  ChevronDown,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface StoreData {
  id: string
  name: string
  address: string
}

interface UserData {
  id: string
  email: string
}

interface NavbarData {
  user: UserData
  managerStores: Array<{
    is_primary: boolean
    stores: {
      id: string
      name: string
      address: string
    }
  }>
}

function NavbarSkeleton() {
  return (
    <nav className='border-b'>
      <div className='container mx-auto px-4 flex h-14 items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Skeleton className='h-5 w-24' />
          <div className='hidden sm:flex items-center space-x-2'>
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-10 w-32' />
          </div>
        </div>
        <div className='flex items-center space-x-4'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-10' />
        </div>
      </div>
    </nav>
  )
}

export function Navbar() {
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
    return <NavbarSkeleton />
  }

  const { user, managerStores } = data

  const stores = managerStores.map((item) => ({
    id: item.stores.id,
    name: item.stores.name,
    address: item.stores.address,
    is_primary: item.is_primary,
  }))

  return (
    <nav className='border-b'>
      <div className='container mx-auto px-4 flex h-14 items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Link href='/manager' className='font-bold'>
            Manager Portal
          </Link>
          <div className='hidden sm:flex items-center space-x-2'>
            <Button variant='ghost' asChild>
              <Link href='/manager'>
                <Store className='w-4 h-4 mr-2' />
                Stores
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
              <Link href='/manager/settings'>
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
                      <Link href='/manager'>
                        <Home className='w-4 h-4 mr-2' />
                        Home
                      </Link>
                    </Button>

                    {/* Mobile settings link */}
                    <Button
                      variant='ghost'
                      asChild
                      className='justify-start h-10 px-2'
                      onClick={() => setOpen(false)}
                    >
                      <Link href='/manager/settings'>
                        <Settings className='w-4 h-4 mr-2' />
                        Settings
                      </Link>
                    </Button>

                    <Collapsible className='w-full'>
                      <CollapsibleTrigger className='flex w-full items-center justify-between h-10 px-2 hover:bg-accent hover:text-accent-foreground rounded-md text-sm'>
                        <div className='flex items-center'>
                          <Store className='w-4 h-4 mr-2' />
                          <span>My Stores</span>
                        </div>
                        <ChevronDown className='h-4 w-4' />
                      </CollapsibleTrigger>
                      <CollapsibleContent className='pl-6 pt-1'>
                        {stores && stores.length > 0 ? (
                          <div className='flex flex-col gap-2 pb-2'>
                            {stores.map((store) => (
                              <div
                                key={store.id}
                                className='border-l-2 pl-3 py-1'
                              >
                                <div className='text-sm font-medium'>
                                  {store.name}
                                </div>
                                <div className='flex flex-col gap-1 mt-1'>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    asChild
                                    className='justify-start h-8 px-2'
                                    onClick={() => setOpen(false)}
                                  >
                                    <Link href={`/manager/store/${store.id}`}>
                                      <Store className='h-3 w-3 mr-1.5' />
                                      <span className='text-xs'>Details</span>
                                    </Link>
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    asChild
                                    className='justify-start h-8 px-2'
                                    onClick={() => setOpen(false)}
                                  >
                                    <Link
                                      href={`/manager/store/${store.id}/schedule`}
                                    >
                                      <Calendar className='h-3 w-3 mr-1.5' />
                                      <span className='text-xs'>Schedule</span>
                                    </Link>
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    asChild
                                    className='justify-start h-8 px-2'
                                    onClick={() => setOpen(false)}
                                  >
                                    <Link
                                      href={`/manager/store/${store.id}/availability`}
                                    >
                                      <Clock className='h-3 w-3 mr-1.5' />
                                      <span className='text-xs'>
                                        Availabilities
                                      </span>
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className='text-xs text-muted-foreground py-2'>
                            No stores added yet
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
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
              <Button
                variant='ghost'
                className='text-red-600 hover:text-red-600 hover:bg-red-100'
                type='submit'
              >
                <LogOut className='w-4 h-4 mr-2' />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
