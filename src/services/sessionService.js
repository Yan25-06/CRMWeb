import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

export const getSessionsByClass = async (classId) => {
  const { data, error } = await supabase
    .from('sessions').select('*').eq('class_id', classId).order('date', { ascending: false })
  return rows(data, error)
}

export const getSessionById = async (id) => {
  const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single()
  return row(data, error)
}

export const createSession = async (sessionData) => {
  const { data: session, error } = await supabase
    .from('sessions').insert(toSnake(sessionData)).select().single()
  if (error) throw error

  // Side-effect: create homework stubs for active students
  const { data: enrollments } = await supabase
    .from('enrollments').select('student_id').eq('class_id', sessionData.classId).eq('status', 'active')

  if (enrollments?.length) {
    const now = new Date().toISOString()
    const stubs = enrollments.map(e => ({
      session_id: session.id,
      student_id: e.student_id,
      progress: 'not_done',
      title: '',
      note: '',
      created_at: now,
      updated_at: now,
    }))
    await supabase.from('homeworks').insert(stubs)
  }

  return row(session, null)
}

export const updateSession = async (id, sessionData) => {
  const { data, error } = await supabase
    .from('sessions').update({ ...toSnake(sessionData), updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  return row(data, error)
}

export const deleteSession = async (id) => {
  // Cascade deletes attendance + homeworks via FK ON DELETE CASCADE
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw error
}
