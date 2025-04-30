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
  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[800px]'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[200px] sticky left-0 bg-background z-10'>
                Employee
              </TableHead>
              {weekDates.map((date) => (
                <TableHead
                  key={date.toString()}
                  className='text-center min-w-[150px]'
                >
                  <div className='hidden sm:block'>
                    {format(date, 'EEE ')}
                    {format(date, 'MMM d')}
                  </div>
                  <div className='sm:hidden'>
                    {format(date, 'E ')}
                    {format(date, 'd')}
                  </div>
                </TableHead>
              ))}
              <TableHead className='text-center w-[100px]'>Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className='font-medium sticky left-0 bg-background z-10'>
                  {employee.full_name}
                </TableCell>
                {weekDates.map((date) => {
                  const shift = shifts.find(
                    (s) =>
                      s.employee_id === employee.id &&
                      s.start_time.split('T')[0] === format(date, 'yyyy-MM-dd')
                  )
                  return (
                    <TableCell
                      key={date.toString()}
                      className='text-center p-0'
                    >
                      <ShiftCell
                        shift={shift}
                        date={date}
                        employee={employee}
                        viewOnly={viewOnly}
                        isShiftLoading={isShiftLoading}
                        pendingOperations={pendingOperations}
                        onEditClick={onShiftClick}
                      />
                    </TableCell>
                  )
                })}
                <TableCell className='text-center font-medium'>
                  {calculateTotalHours(shifts, employee.id).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
})
