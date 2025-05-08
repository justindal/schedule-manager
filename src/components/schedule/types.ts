export interface Profile {
  id: string
  full_name: string
}

export interface Employee {
  id: string
  full_name: string
  is_manager: boolean
}

export interface Shift {
  id: string
  schedule_id: string
  employee_id: string | null
  start_time: string
  end_time: string
  break_duration?: string
  notes?: string
  original_employee_name?: string
}

export interface Schedule {
  id: string
  store_id: string
  week_start_date: string
  published: boolean
}

export interface AvailabilityData {
  id: string
  user_id: string
  store_id: string
  date: string
  status: 'available' | 'unavailable'
  start_time?: string
  end_time?: string
}

export interface EmployeeJoinResult {
  employee_id: string
  profiles: Profile
}

export interface ManagerJoinResult {
  manager_id: string
  profiles: Profile
}

export interface ProcessingCell {
  employeeId: string
  date: string
  action: 'save' | 'delete'
}

export interface PendingOperation {
  type: 'create' | 'update' | 'delete'
  status: 'pending' | 'success' | 'error'
  timestamp: number
  employeeId: string
  dateString: string
  data?: ShiftFormValues
}

export interface ShiftFormValues {
  startTime: string
  endTime: string
  notes?: string
}
