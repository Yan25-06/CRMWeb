import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [teacher, setTeacher] = useState(null) // { id, email, name, isAdmin }
  const [loading, setLoading] = useState(true)

  const fetchTeacher = async (userId) => {
    const { data } = await supabase
      .from('teachers')
      .select('id, email, name, is_admin')
      .eq('id', userId)
      .single()
    if (data) {
      setTeacher({ id: data.id, email: data.email, name: data.name, isAdmin: data.is_admin })
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchTeacher(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchTeacher(session.user.id)
      else setTeacher(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const logout = () => supabase.auth.signOut()

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

  return (
    <AuthContext.Provider value={{ user, teacher, loading, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
