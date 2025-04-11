import { createClient } from '@/app/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get employee stores
    const { data: storeEmployees } = await supabase
      .from('store_employees')
      .select(
        `
        stores (
          id,
          name
        )
      `
      )
      .eq('employee_id', user.id)

    // Get manager stores
    const { data: managerStores } = await supabase
      .from('store_managers')
      .select(
        `
        is_primary,
        stores (
          id,
          name,
          address
        )
      `
      )
      .eq('manager_id', user.id)

    return NextResponse.json({
      user,
      employeeStores: storeEmployees || [],
      managerStores: managerStores || [],
    })
  } catch (error) {
    console.error('Error fetching navbar data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}
