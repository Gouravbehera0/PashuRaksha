import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserRole, getDashboardPath } from '@/services/auth'
import type { UserRole } from '@/types'
import type { Session } from '@supabase/supabase-js'
import { cleanupUserOfflineData } from '@/services/offline/db'

export interface AppUser {
  id: string
  email?: string
  phone?: string
  role?: UserRole
}

interface AuthContextValue {
  user: AppUser | null
  session: Session | null
  role: UserRole | null
  isLoading: boolean
  isAuthenticated: boolean
  dashboardPath: string
  loginAsPreviewRole: (role: UserRole) => void
  signOut: () => Promise<void>
}

const PREVIEW_USER_KEY = 'pashuraksha_preview_role'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for saved prototype preview role in development/testing
    const savedPreviewRole = localStorage.getItem(PREVIEW_USER_KEY) as UserRole | null
    if (savedPreviewRole) {
      setRole(savedPreviewRole)
      setUser({
        id: `demo-${savedPreviewRole}`,
        email: `${savedPreviewRole}@demo.pashuraksha.in`,
        role: savedPreviewRole,
      })
      setIsLoading(false)
      return
    }

    // Get initial Supabase session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        const u = data.session.user
        setUser({
          id: u.id,
          email: u.email,
          phone: u.phone,
        })
        getUserRole(u.id).then(setRole)
      }
      setIsLoading(false)
    }).catch(() => {
      setIsLoading(false)
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          const u = session.user
          setUser({
            id: u.id,
            email: u.email,
            phone: u.phone,
          })
          const userRole = await getUserRole(u.id)
          setRole(userRole)
        } else if (!localStorage.getItem(PREVIEW_USER_KEY)) {
          setUser(null)
          setRole(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loginAsPreviewRole = (previewRole: UserRole) => {
    localStorage.setItem(PREVIEW_USER_KEY, previewRole)
    setRole(previewRole)
    setUser({
      id: `demo-${previewRole}`,
      email: `${previewRole}@demo.pashuraksha.in`,
      role: previewRole,
    })
  }

  const handleSignOut = async () => {
    localStorage.removeItem(PREVIEW_USER_KEY)
    const currentUserId = user?.id
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore if Supabase client is in placeholder config
    }
    if (currentUserId) {
      await cleanupUserOfflineData(currentUserId)
    }
    setUser(null)
    setSession(null)
    setRole(null)
  }

  const value: AuthContextValue = {
    user,
    session,
    role,
    isLoading,
    isAuthenticated: !!user,
    dashboardPath: role ? getDashboardPath(role) : '/dashboard',
    loginAsPreviewRole,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
