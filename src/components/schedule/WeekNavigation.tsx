import React from 'react'
import { format, addWeeks, subWeeks } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeekNavigationProps {
  currentWeek: Date
  weekDates: Date[]
  onWeekChange: (newWeek: Date) => void
}

export function WeekNavigation({
  currentWeek,
  weekDates,
  onWeekChange,
}: WeekNavigationProps) {
  return (
    <div className='bg-card rounded-md p-4 border'>
      <div className='flex items-center justify-center gap-3'>
        <Button
          onClick={() => onWeekChange(subWeeks(currentWeek, 1))}
          variant='outline'
          size='icon'
          className='h-8 w-8'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        <div className='font-medium text-center px-4 py-2 bg-muted rounded-md'>
          <div className='hidden sm:block'>
            {format(weekDates[0], 'MMMM d')} -{' '}
            {format(weekDates[6], 'MMMM d, yyyy')}
          </div>
          <div className='sm:hidden'>
            {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d')}
          </div>
        </div>

        <Button
          onClick={() => onWeekChange(addWeeks(currentWeek, 1))}
          variant='outline'
          size='icon'
          className='h-8 w-8'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}
