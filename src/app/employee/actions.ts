'use server'

import { createClient } from '@/app/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function leaveStore(storeId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify the employee-store relationship exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('store_employees')
      .select('*')
      .eq('store_id', storeId)
      .eq('employee_id', user.id)
      .single()

    if (checkError || !existingRecord) {
      return {
        success: false,
        error: 'You are not associated with this store',
      }
    }

    // Delete the employee-store relationship
    const { error: deleteError } = await supabase
      .from('store_employees')
      .delete()
      .eq('store_id', storeId)
      .eq('employee_id', user.id)

    if (deleteError) {
      return {
        success: false,
        error: 'Failed to remove you from the store',
      }
    }

    revalidatePath('/employee')
    revalidatePath(`/employee/store/${storeId}`)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    }
  }
}
