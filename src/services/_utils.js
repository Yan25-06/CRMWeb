import { supabase } from '@/lib/supabase'

// Get the currently authenticated user's id (= teacher_id for RLS).
// Throws if not logged in — every write needs this.
export const currentUserId = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  const id = data?.user?.id
  if (!id) throw new Error('Chưa đăng nhập')
  return id
}

// Convert snake_case DB column names to camelCase for JS
export const toCamel = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
      v,
    ])
  )
}

// Convert camelCase JS keys to snake_case for DB inserts/updates
export const toSnake = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [
        k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`),
        v,
      ])
  )
}

// Handle Supabase response — throws on error, returns data
export const handle = (data, error) => {
  if (error) throw error
  return data
}

export const rows  = (data, error) => handle(data?.map(toCamel) ?? [], error)
export const row   = (data, error) => handle(data ? toCamel(data) : null, error)
