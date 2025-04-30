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
  User,
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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface StoreData {
  id: string
  name: string
  address: string
  role: 'manager' | 'employee' | 'both'
}

interface UserData {
  id: string
  email: string
  full_name?: string
}

interface NavbarData {
  user: UserData
  stores: StoreData[]
}

function NavbarSkeleton() {
  return (
    <nav className='border-b'>
      <div className='container mx-auto px-4 flex h-14 items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Skeleton className='h-5 w-24' />
          <div className='hidden sm:flex items-center space-x-2'>
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

export function UnifiedNavbar() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NavbarData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/user/unified-navbar-data')
        if (!response.ok) {
          throw new Error('Failed to fetch navbar data')
        }
        const json = await response.json()
        setData(json)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading || !data) {
    return <NavbarSkeleton />
  }

  const { user, stores } = data

  const managedStores = stores.filter(
    (store) => store.role === 'manager' || store.role === 'both'
  )

  const employeeStores = stores.filter(
    (store) => store.role === 'employee' || store.role === 'both'
  )

  return (
    <nav className='border-b'>
      <div className='container mx-auto px-4 flex h-14 items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Link href='/dashboard' className='font-bold'>
            Schedule Manager
          </Link>
          <div className='hidden sm:flex items-center space-x-2'>
            <Button variant='ghost' asChild>
              <Link href='/dashboard'>
                <Store className='w-4 h-4 mr-2' />
                My Stores
              </Link>
            </Button>
          </div>
        </div>
        <div className='flex items-center space-x-4'>
          <span className='hidden sm:inline text-sm text-muted-foreground'>
            {user?.full_name || user?.email}
          </span>

          <div className='hidden sm:block'>
            <Button variant='ghost' size='sm' asChild>
              <Link href='/settings'>
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
                    {user?.full_name || user?.email}
                  </div>

                  <div className='flex flex-col gap-1'>
                    <Button
                      variant='ghost'
                      asChild
                      className='justify-start h-10 px-2'
                      onClick={() => setOpen(false)}
                    >
                      <Link href='/dashboard'>
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
                      <Link href='/settings'>
                        <Settings className='w-4 h-4 mr-2' />
                        Settings
                      </Link>
                    </Button>

                    {stores.length > 0 && (
                      <Collapsible className='w-full'>
                        <CollapsibleTrigger className='flex w-full items-center justify-between h-10 px-2 hover:bg-accent hover:text-accent-foreground rounded-md text-sm'>
                          <div className='flex items-center'>
                            <Store className='w-4 h-4 mr-2' />
                            <span>My Stores</span>
                          </div>
                          <ChevronDown className='h-4 w-4' />
                        </CollapsibleTrigger>
                        <CollapsibleContent className='pl-3 pt-1'>
                          <Tabs defaultValue='all' className='w-full'>
                            <TabsList className='w-full mb-2'>
                              <TabsTrigger value='all' className='flex-1'>
                                All
                              </TabsTrigger>
                              {managedStores.length > 0 && (
                                <TabsTrigger value='managed' className='flex-1'>
                                  Managed
                                </TabsTrigger>
                              )}
                              {employeeStores.length > 0 && (
                                <TabsTrigger
                                  value='employee'
                                  className='flex-1'
                                >
                                  Employee
                                </TabsTrigger>
                              )}
                            </TabsList>

                            <TabsContent value='all'>
                              {stores.map((store) => (
                                <div key={store.id} className='mb-2'>
                                  <Button
                                    variant='ghost'
                                    asChild
                                    className='w-full justify-start h-auto py-2'
                                    onClick={() => setOpen(false)}
                                  >
                                    <Link href={`/store/${store.id}`}>
                                      <div>
                                        <div className='flex items-center'>
                                          <Store className='w-4 h-4 mr-2' />
                                          {store.name}
                                        </div>
                                        <div className='text-xs text-muted-foreground mt-1'>
                                          {store.address}
                                        </div>
                                        <div className='flex gap-1 mt-1'>
                                          {store.role === 'both' && (
                                            <>
                                              <Badge
                                                variant='outline'
                                                className='text-xs'
                                              >
                                                Manager
                                              </Badge>
                                              <Badge
                                                variant='outline'
                                                className='text-xs'
                                              >
                                                Employee
                                              </Badge>
                                            </>
                                          )}
                                          {store.role === 'manager' && (
                                            <Badge
                                              variant='outline'
                                              className='text-xs'
                                            >
                                              Manager
                                            </Badge>
                                          )}
                                          {store.role === 'employee' && (
                                            <Badge
                                              variant='outline'
                                              className='text-xs'
                                            >
                                              Employee
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </Link>
                                  </Button>
                                </div>
                              ))}
                            </TabsContent>

                            {managedStores.length > 0 && (
                              <TabsContent value='managed'>
                                {managedStores.map((store) => (
                                  <div key={store.id} className='mb-2'>
                                    <Button
                                      variant='ghost'
                                      asChild
                                      className='w-full justify-start h-auto py-2'
                                      onClick={() => setOpen(false)}
                                    >
                                      <Link href={`/store/${store.id}`}>
                                        <div>
                                          <div className='flex items-center'>
                                            <Store className='w-4 h-4 mr-2' />
                                            {store.name}
                                          </div>
                                          <div className='text-xs text-muted-foreground mt-1'>
                                            {store.address}
                                          </div>
                                          <div className='flex gap-1 mt-1'>
                                            <Badge
                                              variant='outline'
                                              className='text-xs'
                                            >
                                              Manager
                                            </Badge>
                                            {store.role === 'both' && (
                                              <Badge
                                                variant='outline'
                                                className='text-xs'
                                              >
                                                Employee
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </Link>
                                    </Button>
                                  </div>
                                ))}
                              </TabsContent>
                            )}

                            {employeeStores.length > 0 && (
                              <TabsContent value='employee'>
                                {employeeStores.map((store) => (
                                  <div key={store.id} className='mb-2'>
                                    <Button
                                      variant='ghost'
                                      asChild
                                      className='w-full justify-start h-auto py-2'
                                      onClick={() => setOpen(false)}
                                    >
                                      <Link href={`/store/${store.id}`}>
                                        <div>
                                          <div className='flex items-center'>
                                            <Store className='w-4 h-4 mr-2' />
                                            {store.name}
                                          </div>
                                          <div className='text-xs text-muted-foreground mt-1'>
                                            {store.address}
                                          </div>
                                          <div className='flex gap-1 mt-1'>
                                            <Badge
                                              variant='outline'
                                              className='text-xs'
                                            >
                                              Employee
                                            </Badge>
                                            {store.role === 'both' && (
                                              <Badge
                                                variant='outline'
                                                className='text-xs'
                                              >
                                                Manager
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </Link>
                                    </Button>
                                  </div>
                                ))}
                              </TabsContent>
                            )}
                          </Tabs>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    <Button
                      variant='ghost'
                      className='justify-start h-10 px-2'
                      onClick={async () => {
                        await signOut()
                      }}
                    >
                      <LogOut className='w-4 h-4 mr-2' />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Button
            variant='ghost'
            size='sm'
            onClick={async () => {
              await signOut()
            }}
          >
            <LogOut className='w-4 h-4' />
          </Button>
        </div>
      </div>
    </nav>
  )
}
