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

export default function ManagerSettings() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{
    full_name?: string
    email?: string
  } | null>(null)
  const [signInProvider, setSignInProvider] = useState<string | null>(null)

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        // Get the sign-in provider from app_metadata
        const provider = user.app_metadata?.provider || null
        setSignInProvider(provider)

        // Get user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserProfile(profile)
        }
      }

      setLoading(false)
    }

    loadUserData()
  }, [])

  const handleChangePassword = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsUpdating(true)
    setError(null)

    try {
      const supabase = createClientBrowser()
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      })

      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('Failed to update password. Please try again.')
      console.error('Error updating password:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return <SettingsSkeleton />
  }

  return (
    <div className='container mx-auto py-8 max-w-4xl'>
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
          <Card>
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

          {/* Placeholder for future account settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Preferences</CardTitle>
              <CardDescription>
                Manage your account preferences and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Additional account settings will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='security' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                {signInProvider && signInProvider !== 'email'
                  ? `You signed in with ${signInProvider}. Password change is not available.`
                  : 'Update your password to keep your account secure'}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {error && (
                <div className='p-3 text-sm text-red-500 bg-red-50 rounded-md'>
                  {error}
                </div>
              )}
              {(!signInProvider || signInProvider === 'email') && (
                <>
                  <div className='space-y-2'>
                    <Label htmlFor='new-password'>New Password</Label>
                    <Input
                      id='new-password'
                      type='password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className='space-y-2'>
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
                </>
              )}
            </CardContent>
            <CardFooter>
              {(!signInProvider || signInProvider === 'email') && (
                <Button onClick={handleChangePassword} disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Password'}
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Placeholder for future security settings */}
          <Card>
            <CardHeader>
              <CardTitle>Login Sessions</CardTitle>
              <CardDescription>
                Manage your active login sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Session management will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
