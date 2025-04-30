import { format, parseISO } from 'date-fns'
import { Shift, PendingOperation } from './types'

export function calculateTotalHours(
  shifts: Shift[],
  employeeId: string
): number {
  return shifts
    .filter((shift) => shift.employee_id === employeeId)
    .reduce((total, shift) => {
      const start = new Date(shift.start_time)
      const end = new Date(shift.end_time)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }, 0)
}

export function isCellProcessing(
  employeeId: string,
  dateString: string,
  pendingOps: Record<string, PendingOperation>
): boolean {
  const key = `${employeeId}:${dateString}`
  return Object.keys(pendingOps).some(
    (opKey) => opKey.startsWith(key) && pendingOps[opKey].status === 'pending'
  )
}

export function getOperationKey(
  employeeId: string,
  date: string,
  type: 'create' | 'update' | 'delete'
): string {
  return `${employeeId}:${date}:${type}:${Date.now()}`
}

export function formatTimeDisplay(time24: string): string {
  try {
    if (!time24) return ''
    const date = time24.includes('T')
      ? parseISO(time24)
      : new Date(`2000-01-01T${time24}`)
    return format(date, 'h:mm a')
  } catch (error) {
    console.error('Error formatting time:', error)
    return time24 || ''
  }
}
