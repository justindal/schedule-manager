'use server'

import { createClient, createAdminClient } from '@/app/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteUserAccount(): Promise<{ error?: string } | void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error fetching user for deletion:', userError)
    return { error: 'User not found or not authenticated.' }
  }

  const supabaseAdmin = await createAdminClient()

  const { data: primaryManagerStores, error: primaryCheckError } =
    await supabase
      .from('store_managers')
      .select('store_id')
      .eq('manager_id', user.id)
      .eq('is_primary', true)

  if (primaryCheckError) {
    console.error('Error checking primary manager status:', primaryCheckError)
    return {
      error: 'Could not verify primary manager status. Please try again.',
    }
  }

  if (primaryManagerStores && primaryManagerStores.length > 0) {
    return {
      error:
        'You are a primary manager of one or more stores. Please transfer ownership before deleting your account.',
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching profile for name backup:', profileError)
  }

  if (profile && profile.full_name) {
    const { error: updateShiftsError } = await supabaseAdmin
      .from('shifts')
      .update({ original_employee_name: profile.full_name })
      .eq('employee_id', user.id)

    if (updateShiftsError) {
      console.error(
        'Error updating shifts with original_employee_name:',
        updateShiftsError
      )
    }
  }

  const { error: deleteAuthUserError } =
    await supabaseAdmin.auth.admin.deleteUser(user.id)

  if (deleteAuthUserError) {
    console.error(
      'Error deleting user from Supabase Auth:',
      deleteAuthUserError
    )
    if (deleteAuthUserError.message.includes('referenced from table')) {
      return {
        error:
          'Failed to delete account due to existing references. Please contact support.',
      }
    }
    return {
      error:
        'Failed to delete your account. Please try again or contact support.',
    }
  }

  return
}
