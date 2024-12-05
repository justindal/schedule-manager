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
import { Users } from 'lucide-react'
import { login } from '@/app/actions/auth/login'

export default function EmployeeLogin() {
  const handleSubmit = async (formData: FormData) => {
    await login(formData)
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <Card className='w-[400px]'>
        <CardHeader className='text-center space-y-2'>
          <div className='flex justify-center'>
            <Users className='h-12 w-12 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>Employee Login</CardTitle>
          <CardDescription>
            Sign in to view and manage your schedule
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className='space-y-4'>
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
          </CardContent>
          <CardFooter className='flex flex-col gap-4'>
            <Button type='submit' className='w-full' size='lg'>
              Sign In
            </Button>
            <div className='flex flex-col items-center gap-2 text-sm text-muted-foreground'>
              <p>
                Don&apos;t have an account?{' '}
                <Link
                  href='/employee/register'
                  className='text-primary hover:underline'
                >
                  Create one
                </Link>
              </p>
              <p>
                Not an employee?{' '}
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
