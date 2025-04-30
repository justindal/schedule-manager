import { createClient } from '@/app/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: employeeStores } = await supabase
      .from('store_employees')
      .select(
        `
        store_id
      `
      )
      .eq('employee_id', user.id)

    const { data: managerStores } = await supabase
      .from('store_managers')
      .select(
        `
        store_id
      `
      )
      .eq('manager_id', user.id)

    const storeRolesMap = new Map()

    if (employeeStores) {
      employeeStores.forEach((item) => {
        storeRolesMap.set(item.store_id, {
          role: 'employee',
        })
      })
    }

    if (managerStores) {
      managerStores.forEach((item) => {
        if (storeRolesMap.has(item.store_id)) {
          storeRolesMap.set(item.store_id, {
            role: 'both',
          })
        } else {
          storeRolesMap.set(item.store_id, {
            role: 'manager',
          })
        }
      })
    }

    const storeIds = Array.from(storeRolesMap.keys())

    if (storeIds.length === 0) {
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          full_name: profileData?.full_name,
        },
        stores: [],
      })
    }

    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, address')
      .in('id', storeIds)
      .order('name')

    const storesWithRoles =
      stores?.map((store) => {
        const roleData = storeRolesMap.get(store.id)
        return {
          ...store,
          role: roleData.role,
        }
      }) || []

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: profileData?.full_name,
      },
      stores: storesWithRoles,
    })
  } catch (error) {
    console.error('Error fetching unified navbar data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}
