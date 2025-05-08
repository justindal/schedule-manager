import React, { memo } from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ShiftCell } from './ShiftCell'
import { calculateTotalHours } from './utils'
import { Employee, Shift, PendingOperation } from './types'
import { UserX } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ScheduleTableProps {
  employees: Employee[]
  shifts: Shift[]
  weekDates: Date[]
  viewOnly?: boolean
  isShiftLoading?: (shiftId?: string) => boolean
  pendingOperations?: Record<string, PendingOperation>
  onShiftClick?: (data: {
    employeeId: string
    date: Date
    shift?: Shift
  }) => void
}

export const ScheduleTable = memo(function ScheduleTable({
  employees,
  shifts,
  weekDates,
  viewOnly = true,
  isShiftLoading,
  pendingOperations = {},
  onShiftClick,
}: ScheduleTableProps) {
  const handleShiftClick = (data: {
    employeeId: string
    date: Date
    shift?: Shift
  }) => {
    if (onShiftClick) {
      onShiftClick(data)
    }
  }

  return (
    <div className='rounded-md border overflow-hidden'>
      <Table className='min-w-[700px]'>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[200px] bg-muted/50 sticky left-0'>
              Employee
            </TableHead>
            {weekDates.map((date) => (
              <TableHead
                key={date.toString()}
                className='text-center min-w-[110px]'
              >
                <div className='font-medium'>{format(date, 'EEE')}</div>
                <div className='text-xs font-normal text-muted-foreground'>
                  {format(date, 'MMM d')}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => {
            const isFormerEmployee = employee.id.startsWith('deleted-')

            return (
              <TableRow key={employee.id}>
                <TableCell className='font-medium bg-muted/50 sticky left-0 flex items-center gap-1.5'>
                  {isFormerEmployee ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className='flex items-center gap-1.5 text-muted-foreground'>
                            <UserX className='h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0' />
                            <span>{employee.full_name}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Former employee who has deleted their account.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span>{employee.full_name}</span>
                  )}
                </TableCell>

                {weekDates.map((date) => {
                  const dateString = format(date, 'yyyy-MM-dd')
                  const shift = shifts.find(
                    (s) =>
                      s.employee_id === employee.id &&
                      s.start_time.startsWith(dateString)
                  )

                  return (
                    <TableCell
                      key={`${employee.id}-${dateString}`}
                      className='p-0 text-center h-16'
                    >
                      <ShiftCell
                        employee={employee}
                        date={date}
                        shift={shift}
                        viewOnly={viewOnly}
                        isShiftLoading={isShiftLoading}
                        pendingOperations={pendingOperations}
                        onEditClick={handleShiftClick}
                      />
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
})
