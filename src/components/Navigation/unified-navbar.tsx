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
  SheetClose,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClientBrowser } from '@/app/utils/supabase/client'

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
    <nav className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 items-center justify-between'>
        <Skeleton className='h-6 w-24' />
        <div className='flex items-center space-x-4'>
          <Skeleton className='h-8 w-20 hidden md:block' />
          <Skeleton className='h-10 w-10 rounded-full' />
          <Skeleton className='h-8 w-8 md:hidden' />
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
        console.error('Error fetching navbar data:', error)
        // Redirect to home page on error (likely auth issue)
        window.location.href = '/'
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

  const employeeOnlyStores = stores.filter((store) => store.role === 'employee')

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
  }

  const handleLogout = async () => {
    const supabase = createClientBrowser()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 items-center justify-between'>
        <Link
          href='/dashboard'
          className='mr-6 flex items-center space-x-2 p-2'
        >
          <Store className='h-6 w-6' />
          <span className='font-bold sm:inline-block'>ShiftTrack</span>
        </Link>

        <div className='flex items-center space-x-2 md:space-x-4'>
          <div className='hidden md:block'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost'>
                  <Store className='mr-2 h-4 w-4' />
                  Stores
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuLabel>My Stores</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {managedStores.length > 0 && (
                  <>
                    <DropdownMenuLabel className='text-xs text-muted-foreground px-2'>
                      Managed
                    </DropdownMenuLabel>
                    {managedStores.map((store) => (
                      <DropdownMenuItem key={store.id} asChild>
                        <Link href={`/store/${store.id}`}>{store.name}</Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                {employeeOnlyStores.length > 0 && (
                  <>
                    <DropdownMenuLabel className='text-xs text-muted-foreground px-2'>
                      Staff
                    </DropdownMenuLabel>
                    {employeeOnlyStores.map((store) => (
                      <DropdownMenuItem key={store.id} asChild>
                        <Link href={`/store/${store.id}`}>{store.name}</Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                {stores.length === 0 && (
                  <DropdownMenuItem disabled>No stores found</DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href='/dashboard'>
                    <Store className='mr-2 h-4 w-4' />
                    View All Stores
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src='' alt={user.full_name || user.email} />
                  <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='end' forceMount>
              <DropdownMenuLabel className='font-normal'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-sm font-medium leading-none'>
                    {user.full_name || 'User'}
                  </p>
                  <p className='text-xs leading-none text-muted-foreground'>
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href='/settings'>
                  <Settings className='mr-2 h-4 w-4' />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className='mr-2 h-4 w-4' />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className='md:hidden'>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon'>
                  <Menu className='h-6 w-6' />
                  <span className='sr-only'>Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side='right'
                className='w-full sm:w-[400px] p-0 flex flex-col'
              >
                <SheetHeader className='p-6 pb-0'>
                  <SheetTitle className='sr-only'>Navigation Menu</SheetTitle>
                  <div className='border-b pb-6'>
                    <Link
                      href='/dashboard'
                      className='flex items-center space-x-2'
                      onClick={() => setOpen(false)}
                    >
                      <Store className='h-6 w-6' />
                      <span className='font-bold'>ShiftTrack</span>
                    </Link>
                  </div>
                </SheetHeader>
                <div className='flex-1 overflow-y-auto p-6'>
                  <Accordion type='single' collapsible className='w-full'>
                    <AccordionItem value='all-stores'>
                      <AccordionTrigger className='text-base'>
                        <div className='flex items-center gap-2'>
                          <Store className='h-5 w-5' />
                          All Stores
                          <span className='ml-1 text-xs rounded-full bg-muted px-2 py-0.5'>
                            {stores.length}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className='flex flex-col space-y-3 pl-8 pr-2 max-h-60 overflow-y-auto'>
                          {stores.length > 0 ? (
                            stores.map((store) => (
                              <div
                                key={`${store.id}-all`}
                                className='space-y-1 border-l-2 border-muted pl-3 pt-1 pb-2'
                              >
                                <p className='font-medium text-sm mb-1'>
                                  {store.name}
                                </p>
                                <SheetClose asChild>
                                  <Link
                                    href={`/store/${store.id}`}
                                    className='block py-1 px-2 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                                  >
                                    Details
                                  </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                  <Link
                                    href={`/store/${store.id}/availability`}
                                    className='block py-1 px-2 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                                  >
                                    View Availabilities
                                  </Link>
                                </SheetClose>
                                {(store.role === 'manager' ||
                                  store.role === 'both') && (
                                  <SheetClose asChild>
                                    <Link
                                      href={`/store/${store.id}/schedule`}
                                      className='block py-1 px-2 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                                    >
                                      Manage Schedule
                                    </Link>
                                  </SheetClose>
                                )}
                                <SheetClose asChild>
                                  <Link
                                    href={`/store/${store.id}/my-availability`}
                                    className='block py-1 px-2 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                                  >
                                    My Availability
                                  </Link>
                                </SheetClose>
                              </div>
                            ))
                          ) : (
                            <p className='text-muted-foreground text-sm px-3 py-2'>
                              No stores found.
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {managedStores.length > 0 && (
                      <AccordionItem value='managed-stores'>
                        <AccordionTrigger className='text-base'>
                          <div className='flex items-center gap-2'>
                            <Store className='h-5 w-5' />
                            Managed Stores
                            <span className='ml-1 text-xs rounded-full bg-muted px-2 py-0.5'>
                              {managedStores.length}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className='flex flex-col space-y-3 pl-8 pr-2 max-h-60 overflow-y-auto'>
                            {managedStores.map((store) => (
                              <div
                                key={`${store.id}-managed`}
                                className='space-y-1 border-l-2 border-muted pl-3 pt-1 pb-2'
                              >
                                <p className='font-medium text-sm mb-1'>
                                  {store.name}
                                </p>
                                <SheetClose asChild>
                                  <Link
                                    href={`/store/${store.id}`}
                                    className='block py-1 px-2 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                                  >
                                    Details
                                  </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                  <Link
                                    href={`/store/${store.id}/availability`}
                                    className='block py-1 px-2 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                                  >
                                    View Availabilities
                                  </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                  <Link
                                    href={`/store/${store.id}/schedule`}
                                    className='block py-1 px-2 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                                  >
                                    Manage Schedule
                                  </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                  <Link
                                    href={`/store/${store.id}/my-availability`}
                                    className='block py-1 px-2 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                                  >
                                    My Availability
                                  </Link>
                                </SheetClose>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {employeeOnlyStores.length > 0 && (
                      <AccordionItem value='staff-stores'>
                        <AccordionTrigger className='text-base'>
                          <div className='flex items-center gap-2'>
                            <User className='h-5 w-5' />
                            Staff Stores
                            <span className='ml-1 text-xs rounded-full bg-muted px-2 py-0.5'>
                              {employeeOnlyStores.length}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className='flex flex-col space-y-3 pl-8 pr-2 max-h-60 overflow-y-auto'>
                            {employeeOnlyStores.map((store) => (
                              <div
                                key={`${store.id}-staff`}
                                className='space-y-1 border-l-2 border-muted pl-3 pt-1 pb-2'
                              >
                                <p className='font-medium text-sm mb-1'>
                                  {store.name}
                                </p>
                                <SheetClose asChild>
                                  <Link
                                    href={`/store/${store.id}`}
                                    className='block py-1 px-2 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                                  >
                                    Details
                                  </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                  <Link
                                    href={`/store/${store.id}/availability`}
                                    className='block py-1 px-2 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                                  >
                                    View Availabilities
                                  </Link>
                                </SheetClose>
                                <SheetClose asChild>
                                  <Link
                                    href={`/store/${store.id}/my-availability`}
                                    className='block py-1 px-2 text-xs rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                                  >
                                    My Availability
                                  </Link>
                                </SheetClose>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
