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
import { ContinueButton } from '@/components/Buttons/ContinueButton'

export default function Home() {
  return (
    <div className='min-h-screen bg-background'>
      <nav className='border-b px-4 py-3'>
        <div className='max-w-7xl mx-auto flex justify-between items-center'>
          <div className='flex items-center gap-2'>
            <CalendarDays className='h-6 w-6 text-primary' />
            <span className='font-bold text-xl'>Schedule Manager</span>
          </div>
          <div className='flex gap-4'>
            <Link href='/about'>About</Link>
            <Link href='/contact'>Contact</Link>
          </div>
        </div>
      </nav>

      <main className='max-w-7xl mx-auto px-4 py-12'>
        <div className='absolute inset-0 -z-10 overflow-hidden'>
          <div className='absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full bg-primary/5' />
          <div className='absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-primary/5' />
        </div>

        <div className='flex justify-center mb-12'>
          <Card className='w-[500px]'>
            <CardHeader className='text-center space-y-2'>
              <CardTitle className='text-3xl font-bold'>
                Schedule Manager
              </CardTitle>
              <CardDescription className='text-xl'>
                Streamline your workforce scheduling
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-6'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center gap-2'>
                  <CalendarDays className='h-5 w-5 text-primary' />
                  <span>Easy Scheduling</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Users className='h-5 w-5 text-primary' />
                  <span>Team Management</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Clock className='h-5 w-5 text-primary' />
                  <span>Time Tracking</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Shield className='h-5 w-5 text-primary' />
                  <span>Secure Access</span>
                </div>
              </div>
            </CardContent>

            <p className='text-muted-foreground text-center pb-3'>
              Please select how you would like to continue.
            </p>

            <CardFooter className='flex flex-col gap-4'>
              <div className='w-full'>
                <ContinueButton role='employee' />
              </div>
              <div className='w-full'>
                <ContinueButton role='manager' variant='outline' />
              </div>
              <p className='text-xs text-center text-muted-foreground mt-2'>
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </CardFooter>
          </Card>
        </div>

        <div className='grid md:grid-cols-3 gap-8'>
          <div className='text-center p-6 rounded-lg bg-card border'>
            <CalendarDays className='h-12 w-12 text-primary mx-auto mb-4' />
            <h3 className='text-xl font-semibold mb-2'>Easy Scheduling</h3>
            <p className='text-muted-foreground'>
              Schedule creation based on availability and preferences
            </p>
          </div>
          <div className='text-center p-6 rounded-lg bg-card border'>
            <Users className='h-12 w-12 text-primary mx-auto mb-4' />
            <h3 className='text-xl font-semibold mb-2'>Team Collaboration</h3>
            <p className='text-muted-foreground'>
              Real-time schedule updates for your team
            </p>
          </div>
          <div className='text-center p-6 rounded-lg bg-card border'>
            <Clock className='h-12 w-12 text-primary mx-auto mb-4' />
            <h3 className='text-xl font-semibold mb-2'>Time Management</h3>
            <p className='text-muted-foreground'>
              Track shifts and employee availability for better scheduling
            </p>
          </div>
        </div>
      </main>

      <footer className='border-t mt-auto'>
        <div className='max-w-7xl mx-auto px-4 py-8'>
          <div className='grid md:grid-cols-3 gap-8'>
            <div>
              <h4 className='font-semibold mb-4'>Quick Links</h4>
              <div className='space-y-2'>
                <Link
                  href='/features'
                  className='block text-muted-foreground hover:text-primary'
                >
                  Features
                </Link>
                <Link
                  href='/contact'
                  className='block text-muted-foreground hover:text-primary'
                >
                  Contact
                </Link>
              </div>
            </div>

            <div>
              <h4 className='font-semibold mb-4'>Legal</h4>
              <div className='space-y-2'>
                <Link
                  href='/privacy'
                  className='block text-muted-foreground hover:text-primary'
                >
                  Privacy Policy
                </Link>
                <Link
                  href='/terms'
                  className='block text-muted-foreground hover:text-primary'
                >
                  Terms & Conditions
                </Link>
              </div>
            </div>

            <div>
              <h4 className='font-semibold mb-4'>Tech Stack</h4>
              <div className='space-y-2'>
                <span className='block text-muted-foreground'>Next.js</span>
                <span className='block text-muted-foreground'>React</span>
                <span className='block text-muted-foreground'>
                  Tailwind CSS
                </span>
                <span className='block text-muted-foreground'>shadcn/ui</span>
                <span className='block text-muted-foreground'>supabase</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
