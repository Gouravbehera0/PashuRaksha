import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'

export interface AuthUser {
  id: string
  email?: string
  phone?: string
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface AuthResult {
  user: AuthUser | null
  error: string | null
}

/**
 * Sign in with email and password
 */
export async function signIn(credentials: SignInCredentials): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, error: 'Sign in failed. Please try again.' }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        phone: data.user.phone,
      },
      error: null,
    }
  } catch {
    return { user: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  } catch {
    return { error: 'Sign out failed. Please try again.' }
  }
}

/**
 * Get the current authenticated session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) return null
  return data.session
}

/**
 * Get the user's role from their profile
 * In production, this would query the profiles table
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return data.role as UserRole
  } catch {
    return null
  }
}

/**
 * Get the default dashboard path for a given role
 */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'farmer':
      return '/farmer/dashboard'
    case 'veterinarian':
      return '/vet/command-center'
    case 'admin':
      return '/admin/dashboard'
    default:
      return '/dashboard'
  }
}
