import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import Link from 'next/link'
import { CalendarDays, Users, Clock, Shield, Menu } from 'lucide-react'

export default function Home() {
  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <nav className='border-b px-4 py-3'>
        <div className='max-w-7xl mx-auto flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <CalendarDays className='h-6 w-6 text-primary' />
            <span className='font-bold text-xl'>ShiftTrack</span>
          </div>
          <div className='flex gap-4'>
            <Link href='/contact'>Contact</Link>
          </div>
        </div>
      </nav>

      <div className='absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full bg-primary/5' />
        <div className='absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-primary/5' />
      </div>

      <main className='flex-grow max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-24'>
        <div className='text-center mb-16'>
          <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold mb-4'>
            ShiftTrack
          </h1>
          <p className='text-lg sm:text-lg text-muted-foreground mb-4'>
            The simplest way to manage employee shifts and availability.
          </p>
          <Button asChild size='lg'>
            <Link href='/login'>Login / Sign Up</Link>
          </Button>
          <p className='text-xs text-muted-foreground mt-3'>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <div className='mb-16'>
          <h2 className='text-3xl font-bold text-center mb-10'>
            Everything you need for smooth scheduling
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8'>
            <div className='text-center p-6 rounded-lg bg-card border'>
              <CalendarDays className='h-12 w-12 text-primary mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Easy Scheduling</h3>
              <p className='text-muted-foreground'>
                Effortlessly create optimal schedules considering employee
                availability and preferences, saving you time.
              </p>
            </div>
            <div className='text-center p-6 rounded-lg bg-card border'>
              <Users className='h-12 w-12 text-primary mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Team Collaboration</h3>
              <p className='text-muted-foreground'>
                Keep your team informed with real-time schedule updates and easy
                communication.
              </p>
            </div>
            <div className='text-center p-6 rounded-lg bg-card border'>
              <Clock className='h-12 w-12 text-primary mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Time Management</h3>
              <p className='text-muted-foreground'>
                Accurately track work hours and manage employee availability for
                seamless operations.
              </p>
            </div>
            <div className='text-center p-6 rounded-lg bg-card border'>
              <Shield className='h-12 w-12 text-primary mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>Secure Access</h3>
              <p className='text-muted-foreground'>
                Role-based permissions ensure data privacy and secure access for
                managers and staff.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className='border-t mt-auto'>
        <div className='max-w-7xl mx-auto px-4 py-6 text-center text-muted-foreground text-sm'>
          © {new Date().getFullYear()} ShiftTrack. All rights reserved. |{' '}
          <Link href='/privacy' className='hover:underline'>
            Privacy Policy
          </Link>{' '}
          |{' '}
          <Link href='/terms' className='hover:underline'>
            Terms of Service
          </Link>{' '}
          |{' '}
          <Link href='/contact' className='hover:underline'>
            Contact
          </Link>
        </div>
      </footer>
    </div>
  )
}
