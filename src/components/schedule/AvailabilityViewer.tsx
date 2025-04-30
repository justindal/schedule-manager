import React from 'react'
import { format, parseISO } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Employee, AvailabilityData } from './types'

interface AvailabilityViewerProps {
  employees: Employee[]
  availabilities: AvailabilityData[]
}

export function AvailabilityViewer({
  employees,
  availabilities,
}: AvailabilityViewerProps) {
  return (
    <Card className='mb-4 animate-in slide-in-from-top-4 duration-300'>
      <CardHeader className='py-4'>
        <CardTitle>Staff Availabilities</CardTitle>
        <CardDescription>Availability for the current week</CardDescription>
      </CardHeader>
      <CardContent className='max-h-[300px] overflow-y-auto'>
        <div className='space-y-4'>
          {employees.map((employee) => {
            const employeeAvailabilities = availabilities.filter(
              (a) => a.user_id === employee.id
            )
            return (
              <div key={employee.id} className='space-y-1'>
                <h5 className='text-sm font-medium'>{employee.full_name}</h5>
                {employeeAvailabilities.length > 0 ? (
                  <div className='pl-4 space-y-1'>
                    {employeeAvailabilities.map((avail) => {
                      const availDate = parseISO(avail.date)
                      return (
                        <div key={avail.id} className='text-sm'>
                          {format(availDate, 'EEE MMM d')}:{' '}
                          {avail.status === 'available' && avail.start_time ? (
                            <span className='text-green-600'>
                              {avail.start_time.slice(0, 5)} -{' '}
                              {avail.end_time?.slice(0, 5)}
                            </span>
                          ) : (
                            <span className='text-red-600'>Unavailable</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className='pl-4 text-sm text-muted-foreground'>
                    No availability set
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
