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
import { signup } from '@/app/actions/auth/login'

export default function ManagerRegister() {
  const handleSubmit = async (formData: FormData) => {
    await signup(formData, 'manager')
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <Card className='w-[400px]'>
        <CardHeader className='text-center space-y-2'>
          <div className='flex justify-center'>
            <Shield className='h-12 w-12 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>
            Create Manager Account
          </CardTitle>
          <CardDescription>
            Register to start managing your team's schedule
          </CardDescription>
        </CardHeader>

        <form action={handleSubmit}>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input
                id='name'
                name='name'
                type='text'
                placeholder='John Doe'
                required
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
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                name='password'
                type='password'
                required
                minLength={6}
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
              />
            </div>
          </CardContent>

          <CardFooter className='flex flex-col gap-4'>
            <Button type='submit' className='w-full' size='lg'>
              Create Account
            </Button>
            <div className='flex flex-col items-center gap-2 text-sm text-muted-foreground'>
              <p>
                Already have an account?{' '}
                <Link
                  href='/manager/login'
                  className='text-primary hover:underline'
                >
                  Sign in
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
