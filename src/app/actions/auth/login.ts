'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/app/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error?.message === 'Invalid login credentials') {
    return { error: 'Invalid email or password' }
  }

  if (error) {
    console.error(error)
    redirect('/error')
  }

  if (!authData.user) {
    console.error('Login failed')
    redirect('/error')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    console.error(profileError)
    redirect('/error')
  }

  if (profile.role === 'manager') {
    revalidatePath('/', 'layout')
    redirect('/manager/')
  } else {
    revalidatePath('/', 'layout')
    redirect('/employee')
  }
}

export async function signup(formData: FormData, role: 'manager' | 'employee') {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    full_name: formData.get('name') as string,
    role,
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (error || !user) {
    console.error(error || 'User creation failed')
    redirect('/error')
  }

  const { error: profileError } = await supabase.from('profiles').insert([
    {
      id: user.id,
      role: data.role,
      full_name: data.full_name,
      email: data.email,
    },
  ])

  if (profileError) {
    console.error(profileError)
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect(`/${role}`)
}

export async function signOut() {
  'use server'

  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
