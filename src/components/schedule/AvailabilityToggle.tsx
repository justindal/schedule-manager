import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AvailabilityToggleProps {
  showAvailabilities: boolean
  onToggle: () => void
}

export function AvailabilityToggle({
  showAvailabilities,
  onToggle,
}: AvailabilityToggleProps) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(false)
  }, [showAvailabilities])

  const handleClick = () => {
    setIsLoading(true)

    setTimeout(() => {
      try {
        onToggle()
      } catch (error) {
        console.error('Error toggling availabilities:', error)
        setIsLoading(false)
      }
    }, 0)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            onClick={handleClick}
            type='button'
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
            ) : (
              <Calendar className='h-4 w-4 mr-2' />
            )}
            {showAvailabilities ? 'Hide' : 'View'} Availabilities
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Show or hide staff availability for the current week
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
