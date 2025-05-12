'use server'

import { createClient } from '@/app/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function deleteStore(
  storeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated.' }
    }

    const { data: managerData, error: managerError } = await supabase
      .from('store_managers')
      .select('is_primary')
      .eq('store_id', storeId)
      .eq('manager_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()

    if (managerError) {
      console.error('Error checking manager status:', managerError)
      return { success: false, error: 'Could not verify manager status.' }
    }

    if (!managerData) {
      return {
        success: false,
        error: 'Only the primary manager can delete the store.',
      }
    }

    const { error: deleteError } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId)

    if (deleteError) {
      console.error('Error deleting store:', deleteError)
      return { success: false, error: deleteError.message }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/store/${storeId}`)
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error in deleteStore:', error)
    let errorMessage = 'An unexpected error occurred.'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return { success: false, error: errorMessage }
  }
}
