import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

export const getEnrollments = async () => {
  const { data, error } = await supabase.from('enrollments').select('*')
  return rows(data, error)
}

export const getEnrollmentsByClass = async (classId) => {
  const { data, error } = await supabase.from('enrollments').select('*').eq('class_id', classId)
  return rows(data, error)
}

export const getEnrollment = async (studentId, classId) => {
  const { data, error } = await supabase
    .from('enrollments').select('*').eq('student_id', studentId).eq('class_id', classId).maybeSingle()
  return row(data, error)
}

export const getActiveStudents = async (classId) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('student_id, fee_per_session, students(*)')
    .eq('class_id', classId)
    .eq('status', 'active')
  if (error) throw error
  return (data ?? []).map(e => ({ ...e.students, feePerSession: e.fee_per_session }))
}

export const upsertEnrollment = async (enrollmentData) => {
  const now = new Date().toISOString()
  const payload = { ...toSnake(enrollmentData) }
  if (enrollmentData.status === 'paused' && !payload.paused_at) payload.paused_at = now
  if (enrollmentData.status === 'dropped' && !payload.dropped_at) payload.dropped_at = now
  if (enrollmentData.status === 'active') { payload.paused_at = null; payload.dropped_at = null }

  const { data, error } = await supabase
    .from('enrollments').upsert(payload, { onConflict: 'student_id,class_id' }).select().single()
  return row(data, error)
}
