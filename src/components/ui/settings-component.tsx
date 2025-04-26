'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { createClientBrowser } from '@/app/utils/supabase/client'
import { User, Settings } from 'lucide-react'

interface SettingsComponentProps {
  mobile?: boolean
  onClose?: () => void
  email?: string
}

export function SettingsComponent({
  mobile = false,
  onClose,
  email,
}: SettingsComponentProps) {
  const { toast } = useToast()
  const [openPasswordReset, setOpenPasswordReset] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChangePassword = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsUpdating(true)
    setError(null)

    try {
      const supabase = createClientBrowser()
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      })

      setOpenPasswordReset(false)
      setPassword('')
      setConfirmPassword('')
      if (onClose) onClose()
    } catch (err) {
      setError('Failed to update password. Please try again.')
      console.error('Error updating password:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  // For mobile, render a simple button that opens the dialogs
  if (mobile) {
    return (
      <>
        <Button
          variant='ghost'
          className='w-full justify-start'
          onClick={() => setOpenPasswordReset(true)}
        >
          <Settings className='w-4 h-4 mr-2' />
          Account Settings
        </Button>

        <Dialog open={openPasswordReset} onOpenChange={setOpenPasswordReset}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your new password below.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <div className='p-3 text-sm text-red-500 bg-red-50 rounded-md'>
                {error}
              </div>
            )}
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='current-password'>New Password</Label>
                <Input
                  id='new-password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirm-password'>Confirm New Password</Label>
                <Input
                  id='confirm-password'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setOpenPasswordReset(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // For desktop, use a dropdown menu
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon'>
            <User className='h-5 w-5' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {email && (
            <>
              <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                {email}
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onSelect={() => setOpenPasswordReset(true)}>
            Change Password
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openPasswordReset} onOpenChange={setOpenPasswordReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className='p-3 text-sm text-red-500 bg-red-50 rounded-md'>
              {error}
            </div>
          )}
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='current-password'>New Password</Label>
              <Input
                id='new-password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirm-password'>Confirm New Password</Label>
              <Input
                id='confirm-password'
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setOpenPasswordReset(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
