import { supabase } from '@/lib/supabase'
import { rows, row } from './_utils'

// Admin only — list all teachers
export const getTeachers = async () => {
  const { data, error } = await supabase
    .from('teachers').select('id, email, name, is_admin, created_at').order('created_at')
  if (error) throw error
  return (data ?? []).map(t => ({ id: t.id, email: t.email, name: t.name, isAdmin: t.is_admin, createdAt: t.created_at }))
}

// Invite a new teacher — calls the Edge Function (keeps service_role key server-side)
export const inviteTeacher = async (email, name, tempPassword) => {
  const { data, error } = await supabase.functions.invoke('invite-teacher', {
    body: { email, name, tempPassword },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

// Admin get dashboard stats for a specific teacher (read-only view)
export const getTeacherOverview = async (teacherId) => {
  const [{ count: studentCount }, { count: classCount }] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId),
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId),
  ])
  return { studentCount: studentCount ?? 0, classCount: classCount ?? 0 }
}
