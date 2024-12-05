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
import { Shield } from 'lucide-react'
import { login } from '@/app/actions/auth/login'
import { useState } from 'react'

export default function ManagerLogin() {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <Card className='w-[400px]'>
        <CardHeader className='text-center space-y-2'>
          <div className='flex justify-center'>
            <Shield className='h-12 w-12 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>Manager Login</CardTitle>
          <CardDescription>
            Sign in to access your management dashboard
          </CardDescription>
        </CardHeader>

        <form action={handleSubmit}>
          <CardContent className='space-y-4'>
            {error && (
              <div className='p-3 text-sm text-red-500 bg-red-50 rounded-md'>
                {error}
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='name@company.com'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input id='password' name='password' type='password' required />
            </div>

            <div className='flex justify-end'>
              <Link
                href='/forgot-password'
                className='text-sm text-primary hover:underline'
              >
                Forgot password?
              </Link>
            </div>
          </CardContent>

          <CardFooter className='flex flex-col gap-4'>
            <Button type='submit' className='w-full' size='lg'>
              Sign In
            </Button>
            <div className='flex flex-col items-center gap-2 text-sm text-muted-foreground'>
              <p>
                Don&apos;t have an account?{' '}
                <Link
                  href='/manager/register'
                  className='text-primary hover:underline'
                >
                  Create one
                </Link>
              </p>
              <p>
                Not a manager?{' '}
                <Link href='/' className='text-primary hover:underline'>
                  Go back
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
