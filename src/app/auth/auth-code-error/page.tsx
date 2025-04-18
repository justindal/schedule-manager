import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeError() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <div className='w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg'>
        <div className='flex flex-col items-center text-center space-y-4'>
          <div className='p-3 bg-red-50 rounded-full'>
            <AlertCircle className='h-8 w-8 text-red-500' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Authentication Error
          </h1>
          <p className='text-gray-600'>
            There was a problem with your sign-in attempt. The authentication
            code could not be processed.
          </p>
        </div>

        <div className='space-y-4'>
          <p className='text-sm text-gray-500'>Possible reasons:</p>
          <ul className='text-sm text-gray-500 space-y-1 list-disc pl-5'>
            <li>The authentication link has expired</li>
            <li>The link was already used</li>
            <li>There was a technical issue with the authentication service</li>
          </ul>
        </div>

        <div className='flex flex-col gap-4'>
          <Button asChild className='w-full'>
            <Link href='/'>Return to Home</Link>
          </Button>
          <div className='text-center'>
            <Link
              href='/contact'
              className='text-sm text-primary hover:underline'
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
