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
import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { resetPassword } from '@/app/actions/auth/reset-password'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    try {
      await resetPassword(email)
      setIsSubmitted(true)
    } catch (err) {
      setError('Failed to send reset password email. Please try again.')
    }
  }

  if (isSubmitted) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background px-4'>
        <Card className='w-[400px]'>
          <CardHeader className='text-center space-y-2'>
            <div className='flex justify-center'>
              <KeyRound className='h-12 w-12 text-primary' />
            </div>
            <CardTitle className='text-2xl font-bold'>
              Check Your Email
            </CardTitle>
            <CardDescription>
              We&apos;ve sent you instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-center text-sm text-muted-foreground'>
            <p>
              If you don&apos;t see the email, please check your spam folder.
            </p>
          </CardContent>
          <CardFooter className='flex flex-col gap-4'>
            <Button asChild className='w-full' variant='outline'>
              <Link href='/'>Return to Home</Link>
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
          <CardTitle className='text-2xl font-bold'>Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you instructions to
            reset your password.
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
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='name@company.com'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className='flex flex-col gap-4'>
            <Button type='submit' className='w-full' size='lg'>
              Send Reset Instructions
            </Button>
            <div className='text-center text-sm text-muted-foreground'>
              <Link href='/' className='text-primary hover:underline'>
                Return to Home
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
