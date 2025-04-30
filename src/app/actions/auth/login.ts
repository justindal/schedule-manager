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
    redirect('/error')
  }

  if (!authData.user) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    full_name: formData.get('name') as string,
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
      },
    },
  })

  if (error) {
    if (error.message.includes('User already registered')) {
      return { error: 'Email already in use. Please try logging in.' }
    }
    redirect('/error')
  }

  if (!user) {
    redirect('/error')
  }

  await new Promise((resolve) => setTimeout(resolve, 500))

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  'use server'

  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
