import React, { memo } from 'react'
import { format, parseISO } from 'date-fns'
import { Shift, Employee, PendingOperation } from './types'
import { Info, FileText } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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

  const isPending = Object.keys(pendingOperations).some((key) => {
    const [empId, opDate] = key.split(':')
    return (
      empId === employee.id &&
      opDate === dateString &&
      pendingOperations[key].status === 'pending'
    )
  })

  const handleCellClick = () => {
    if (viewOnly || !onEditClick) return
    onEditClick({ employeeId: employee.id, date, shift })
  }

  if (!shift) {
    return (
      <div
        className={`w-full h-full p-2 ${
          !viewOnly ? 'cursor-pointer hover:bg-muted/50' : ''
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
        !viewOnly ? 'cursor-pointer hover:bg-muted/50' : ''
      } ${isLoading || isPending ? 'animate-pulse' : ''}`}
      onClick={handleCellClick}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className='text-sm whitespace-nowrap'>
              {formatTimeString(shift.start_time)}-
              {formatTimeString(shift.end_time)}
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
          {shift.notes && (
            <TooltipContent>
              <p className='max-w-xs font-normal break-words'>{shift.notes}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  )
})
