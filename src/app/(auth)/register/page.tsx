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
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { signup } from '@/app/actions/auth/login'
import { useState } from 'react'
import { AppleSignInButton } from '@/components/ui/apple-sign-in-button'
import { GoogleSignInButton } from '@/components/ui/google-sign-in-button'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <Card className='w-[400px]'>
        <CardHeader className='text-center space-y-2'>
          <div className='flex justify-center'>
            <UserPlus className='h-12 w-12 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>Create Account</CardTitle>
          <CardDescription>Sign up to start using ShiftTrack</CardDescription>
        </CardHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(new FormData(e.currentTarget))
          }}
        >
          <CardContent className='space-y-4'>
            {error && (
              <div className='p-3 text-sm text-red-500 bg-red-50 rounded-md'>
                {error}
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input
                id='name'
                name='name'
                type='text'
                placeholder='John Doe'
                required
                disabled={loading}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='name@company.com'
                required
                disabled={loading}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password (min. 6 characters)</Label>
              <Input
                id='password'
                name='password'
                type='password'
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
              <Input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          </CardContent>

          <CardFooter className='flex flex-col gap-4'>
            <Button
              type='submit'
              className='w-full'
              size='lg'
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className='relative w-full flex items-center justify-center my-2'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300'></div>
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='px-2 bg-background text-muted-foreground'>
                  Or continue with
                </span>
              </div>
            </div>

            <AppleSignInButton />
            <GoogleSignInButton />

            <div className='flex flex-col items-center gap-2 text-sm text-muted-foreground'>
              <p>
                Already have an account?{' '}
                <Link href='/login' className='text-primary hover:underline'>
                  Sign in
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
