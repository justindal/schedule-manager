'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, AlertCircle } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientBrowser } from '@/app/utils/supabase/client'
import Link from 'next/link'

// Loading fallback component
function ResetPasswordLoading() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <Card className='w-[400px]'>
        <CardHeader className='text-center space-y-2'>
          <div className='flex justify-center'>
            <KeyRound className='h-12 w-12 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>Loading...</CardTitle>
          <CardDescription>Preparing your password reset form.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClientBrowser()

        const hasAuthParams =
          searchParams.has('access_token') ||
          searchParams.has('refresh_token') ||
          searchParams.has('code')

        if (!hasAuthParams) {
          setIsAuthenticated(false)
          setError('Invalid reset password link. Please request a new one.')
          return
        }

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error checking session:', error)
          setIsAuthenticated(false)
          setError('Failed to verify authentication. Please try again.')
          return
        }

        setIsAuthenticated(!!data.session)
      } catch (err) {
        console.error('Error in auth check:', err)
        setIsAuthenticated(false)
        setError('An error occurred while verifying your credentials.')
      }
    }

    checkSession()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClientBrowser()
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      router.push('/login?message=Password updated successfully')
    } catch (err) {
      console.error('Error updating password:', err)
      setError('Failed to update password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background px-4'>
        <Card className='w-[400px]'>
          <CardHeader className='text-center space-y-2'>
            <div className='flex justify-center'>
              <KeyRound className='h-12 w-12 text-primary' />
            </div>
            <CardTitle className='text-2xl font-bold'>Loading...</CardTitle>
            <CardDescription>
              Verifying your reset password request.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Show error if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background px-4'>
        <Card className='w-[400px]'>
          <CardHeader className='text-center space-y-2'>
            <div className='flex justify-center'>
              <AlertCircle className='h-12 w-12 text-red-500' />
            </div>
            <CardTitle className='text-2xl font-bold'>Invalid Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <p className='text-sm text-muted-foreground'>
              Please request a new password reset link.
            </p>
          </CardContent>
          <CardFooter className='flex justify-center'>
            <Button asChild>
              <Link href='/reset-password'>Request New Link</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <Card className='w-[400px]'>
        <CardHeader className='text-center space-y-2'>
          <div className='flex justify-center'>
            <KeyRound className='h-12 w-12 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>Set New Password</CardTitle>
          <CardDescription>
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className='space-y-4'>
            {error && (
              <div className='p-3 text-sm text-red-500 bg-red-50 rounded-md'>
                {error}
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='password'>New Password</Label>
              <Input
                id='password'
                name='password'
                type='password'
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm New Password</Label>
              <Input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type='submit'
              className='w-full'
              size='lg'
              disabled={isLoading}
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

// Export the component wrapped in Suspense
export default function ResetPassword() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
