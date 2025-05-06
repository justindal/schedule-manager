'use client'

import { Button } from '@/components/ui/button'
import { signInWithGoogle } from '@/app/actions/auth/google-signin'
import { FcGoogle } from 'react-icons/fc' // Using react-icons for Google logo
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      // Server action handles redirection, no need to await here if not handling client-side errors specifically
      await signInWithGoogle()
      // If signInWithGoogle throws, the error will be caught below
    } catch (error) {
      console.error('Client-side Google Sign-In Error:', error)
      // Optionally, show a user-facing error message here
      setIsLoading(false)
    }
    // No need to setLoading(false) here if redirection happens
  }

  return (
    <Button
      variant='outline'
      className='w-full flex items-center justify-center gap-2'
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
      ) : (
        <FcGoogle className='h-5 w-5' />
      )}
      Sign in with Google
    </Button>
  )
}
