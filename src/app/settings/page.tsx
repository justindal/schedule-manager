'use client'

import { useState, useEffect } from 'react'
import { createClientBrowser } from '@/app/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { UserCog, Key, Settings, UserCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ModeToggle } from '@/components/ui/mode-toggle'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { deleteUserAccount } from '@/app/actions/auth/delete-user'
import { Sun, Moon, Laptop } from 'lucide-react'
import { useTheme } from 'next-themes'

function SettingsSkeleton() {
  return (
    <div className='container mx-auto py-8 max-w-4xl'>
      <div className='flex items-center gap-2 mb-6'>
        <Skeleton className='h-8 w-40' />
      </div>

      <div className='grid gap-6'>
        <Skeleton className='h-10 w-full max-w-xs' />
        <Skeleton className='h-[300px] w-full' />
      </div>
    </div>
  )
}

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
}

function ThemeSegmentedControl() {
  const { theme, setTheme } = useTheme()
  return (
    <div className='flex w-full gap-2 mt-2'>
      <button
        type='button'
        onClick={() => setTheme('light')}
        className={`flex-1 flex flex-col items-center justify-center rounded-md border px-0 py-4 sm:py-6 transition-colors text-base font-medium
          ${
            theme === 'light'
              ? 'bg-primary text-primary-foreground border-primary shadow'
              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
          }
        `}
        aria-pressed={theme === 'light'}
      >
        <Sun className='h-6 w-6 mb-1' />
        Light
      </button>
      <button
        type='button'
        onClick={() => setTheme('dark')}
        className={`flex-1 flex flex-col items-center justify-center rounded-md border px-0 py-4 sm:py-6 transition-colors text-base font-medium
          ${
            theme === 'dark'
              ? 'bg-primary text-primary-foreground border-primary shadow'
              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
          }
        `}
        aria-pressed={theme === 'dark'}
      >
        <Moon className='h-6 w-6 mb-1' />
        Dark
      </button>
      <button
        type='button'
        onClick={() => setTheme('system')}
        className={`flex-1 flex flex-col items-center justify-center rounded-md border px-0 py-4 sm:py-6 transition-colors text-base font-medium
          ${
            theme === 'system'
              ? 'bg-primary text-primary-foreground border-primary shadow'
              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
          }
        `}
        aria-pressed={theme === 'system'}
      >
        <Laptop className='h-6 w-6 mb-1' />
        System
      </button>
    </div>
  )
}

export default function AccountSettings() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signInProvider, setSignInProvider] = useState<string | null>(null)
  const [managedStoresCount, setManagedStoresCount] = useState(0)
  const [employeeStoresCount, setEmployeeStoresCount] = useState(0)

  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createClientBrowser()
        const { data: userData } = await supabase.auth.getUser()

        if (userData?.user) {
          setUser(userData.user)

          const identities = userData.user.identities || []
          if (identities.length > 0) {
            setSignInProvider(identities[0].provider)
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.user.id)
            .single()

          if (profile) {
            setUserProfile(profile)
          }

          const { data: managerStores, error: managerError } = await supabase
            .from('store_managers')
            .select('store_id')
            .eq('manager_id', userData.user.id)

          if (!managerError && managerStores) {
            setManagedStoresCount(managerStores.length)
          }

          const { data: employeeStores, error: employeeError } = await supabase
            .from('store_employees')
            .select('store_id')
            .eq('employee_id', userData.user.id)

          if (!employeeError && employeeStores) {
            setEmployeeStoresCount(employeeStores.length)
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  async function handleChangePassword() {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsUpdating(true)
    setError(null)

    try {
      const supabase = createClientBrowser()
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        toast({
          title: 'Password Updated',
          description: 'Your password has been successfully updated',
        })
        setPassword('')
        setConfirmPassword('')
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDeleteAccount() {
    setIsUpdating(true)
    setError(null)

    const result = await deleteUserAccount()

    if (result?.error) {
      setError(result.error)
      toast({
        title: 'Deletion Failed',
        description: result.error,
        variant: 'destructive',
      })
      setIsUpdating(false)
    } else {
      toast({
        title: 'Account Deleted',
        description: 'Your account has been successfully deleted.',
      })
      const supabase = createClientBrowser()
      await supabase.auth.signOut()
      window.location.href = '/'
    }
  }

  if (loading) {
    return <SettingsSkeleton />
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 py-6 sm:py-8 max-w-4xl'>
      <div className='flex items-center gap-2 mb-6'>
        <Settings className='h-6 w-6' />
        <h1 className='text-2xl font-semibold'>Account Settings</h1>
      </div>

      <Tabs defaultValue='account' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='account'>
            <UserCircle className='h-4 w-4 mr-2' />
            Account
          </TabsTrigger>
          <TabsTrigger value='security'>
            <Key className='h-4 w-4 mr-2' />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value='account' className='space-y-6'>
          <Card className='sm:p-6'>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Choose your theme preference</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSegmentedControl />
            </CardContent>
          </Card>

          <Card className='sm:p-6'>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal account details</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <Label htmlFor='fullName'>Full Name</Label>
                  <div className='mt-1 text-lg font-medium'>
                    {userProfile?.full_name || 'Not set'}
                  </div>
                </div>
                <div>
                  <Label htmlFor='email'>Email</Label>
                  <div className='mt-1 text-lg font-medium'>
                    {userProfile?.email || user?.email || 'Not available'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='sm:p-6'>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
              <CardDescription>
                Summary of your account activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='p-4 border rounded-md flex flex-col items-center justify-center text-center'>
                  <span className='text-2xl font-bold'>
                    {managedStoresCount}
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    Stores You Manage
                  </span>
                </div>
                <div className='p-4 border rounded-md flex flex-col items-center justify-center text-center'>
                  <span className='text-2xl font-bold'>
                    {employeeStoresCount}
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    Stores Where You Work
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='security' className='space-y-6'>
          <Card className='sm:p-6'>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                {signInProvider && signInProvider !== 'email'
                  ? `You signed in with ${signInProvider}. Password change is not available.`
                  : 'Update your password to keep your account secure'}
              </CardDescription>
            </CardHeader>
            {(signInProvider === 'email' || !signInProvider) && (
              <>
                <CardContent className='space-y-4'>
                  {error && (
                    <div className='p-3 text-sm text-red-500 bg-red-50 rounded-md'>
                      {error}
                    </div>
                  )}
                  <div className='space-y-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='new-password'>New Password</Label>
                      <Input
                        id='new-password'
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='confirm-password'>
                        Confirm New Password
                      </Label>
                      <Input
                        id='confirm-password'
                        type='password'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isUpdating}
                    className='ml-auto'
                  >
                    {isUpdating ? 'Updating...' : 'Update Password'}
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>

          <Card className='border-destructive sm:p-6'>
            <CardHeader>
              <CardTitle className='text-destructive'>Danger Zone</CardTitle>
              <CardDescription>
                Deleting your account is a permanent action and cannot be
                undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant='destructive'>Delete Account</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove your data from our servers. If you
                      are the primary manager of any stores, you must transfer
                      primary ownership before deleting your account.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className='sm:justify-start pt-4'>
                    <DialogClose asChild>
                      <Button type='button' variant='outline'>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type='button'
                      variant='destructive'
                      onClick={handleDeleteAccount}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
