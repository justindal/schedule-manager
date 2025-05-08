import React, { memo } from 'react'
import { format, parseISO } from 'date-fns'
import { Shift, Employee, PendingOperation } from './types'
import { Info, FileText, UserX, MinusCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

const formatTimeString = (timeStr: string) => {
  try {
    if (timeStr.includes('T')) {
      const timePart = timeStr.split('T')[1].slice(0, 5)
      const date = new Date(`2000-01-01T${timePart}`)
      return format(date, 'h:mma').toLowerCase().replace(/\s/g, '')
    }

    if (timeStr.includes(':')) {
      const date = new Date(`2000-01-01T${timeStr}`)
      return format(date, 'h:mma').toLowerCase().replace(/\s/g, '')
    }

    return timeStr
  } catch (error) {
    console.error('Error formatting time:', error, timeStr)
    return timeStr || ''
  }
}

interface ShiftCellProps {
  shift?: Shift
  date: Date
  employee: Employee
  viewOnly?: boolean
  isShiftLoading?: (shiftId?: string) => boolean
  pendingOperations?: Record<string, PendingOperation>
  onEditClick?: (data: {
    employeeId: string
    date: Date
    shift?: Shift
  }) => void
}

export const ShiftCell = memo(function ShiftCell({
  shift,
  date,
  employee,
  viewOnly = true,
  isShiftLoading,
  pendingOperations = {},
  onEditClick,
}: ShiftCellProps) {
  const dateString = format(date, 'yyyy-MM-dd')
  const isLoading = isShiftLoading?.(shift?.id)

  const isFormerEmployee = employee.id.startsWith('deleted-')

  const isPending = Object.keys(pendingOperations).some((key) => {
    const [empId, opDate] = key.split(':')
    return (
      empId === employee.id &&
      opDate === dateString &&
      pendingOperations[key].status === 'pending'
    )
  })

  const handleCellClick = () => {
    if (viewOnly || !onEditClick || isFormerEmployee) return
    onEditClick({ employeeId: employee.id, date, shift })
  }

  if (!shift) {
    return (
      <div
        className={`w-full h-full p-2 ${
          !viewOnly && !isFormerEmployee
            ? 'cursor-pointer hover:bg-muted/50'
            : ''
        } ${isPending ? 'animate-pulse' : ''}`}
        onClick={handleCellClick}
      >
        <div className='text-muted-foreground text-sm'>-</div>
      </div>
    )
  }

  return (
    <div
      className={`w-full h-full p-2 ${
        !viewOnly && !isFormerEmployee ? 'cursor-pointer hover:bg-muted/50' : ''
      } ${isLoading || isPending ? 'animate-pulse' : ''} ${
        isFormerEmployee
          ? 'text-muted-foreground border-l-2 border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10'
          : ''
      }`}
      onClick={handleCellClick}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='text-sm whitespace-nowrap flex items-center'>
              <span className='truncate'>
                {formatTimeString(shift.start_time)}-
                {formatTimeString(shift.end_time)}
              </span>

              {isFormerEmployee && (
                <span className='ml-1'>
                  <UserX className='h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500' />
                </span>
              )}

              {shift.notes && (
                <span className='ml-1'>
                  {viewOnly ? (
                    <Info className='h-3 w-3 inline-block text-muted-foreground' />
                  ) : (
                    <FileText className='h-3 w-3 inline-block text-muted-foreground' />
                  )}
                </span>
              )}
            </div>
          </TooltipTrigger>

          <TooltipContent>
            {isFormerEmployee ? (
              <p className='max-w-xs font-normal break-words'>
                <span className='font-semibold text-yellow-600 dark:text-yellow-500 flex items-center gap-1'>
                  <UserX className='h-4 w-4' /> Former Employee
                </span>
                This shift belongs to an employee who has deleted their account.
                {shift.notes && (
                  <>
                    <br />
                    <br />
                    <span className='font-semibold'>Notes:</span> {shift.notes}
                  </>
                )}
              </p>
            ) : shift.notes ? (
              <p className='max-w-xs font-normal break-words'>{shift.notes}</p>
            ) : null}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
})
