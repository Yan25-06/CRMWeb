import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

export const getHomeworkBySession = async (sessionId) => {
  const { data, error } = await supabase.from('homeworks').select('*').eq('session_id', sessionId)
  return rows(data, error)
}

export const getHomeworkByStudent = async (studentId, classId) => {
  const { data: sessions } = await supabase.from('sessions').select('id').eq('class_id', classId)
  if (!sessions?.length) return []

  const { data, error } = await supabase
    .from('homeworks').select('*')
    .eq('student_id', studentId)
    .in('session_id', sessions.map(s => s.id))
  return rows(data, error)
}

export const getHomeworkByRange = async (studentId, classId, fromDate, toDate) => {
  const { data: sessions } = await supabase
    .from('sessions').select('id, date, topic')
    .eq('class_id', classId).gte('date', fromDate).lte('date', toDate)

  if (!sessions?.length) return []
  const sessionMap = new Map(sessions.map(s => [s.id, s]))

  const { data, error } = await supabase
    .from('homeworks').select('*')
    .eq('student_id', studentId)
    .in('session_id', sessions.map(s => s.id))
  if (error) throw error

  return (data ?? [])
    .map(h => ({ ...h, date: sessionMap.get(h.session_id)?.date, sessionTopic: sessionMap.get(h.session_id)?.topic }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map(h => ({ ...h, sessionId: h.session_id, studentId: h.student_id }))
}

export const updateHomework = async (id, data) => {
  const { data: updated, error } = await supabase
    .from('homeworks')
    .update({ ...toSnake(data), updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  return row(updated, error)
}

export const updateSessionHomeworkTitle = async (sessionId, title) => {
  const { error } = await supabase
    .from('homeworks')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('session_id', sessionId)
  if (error) throw error
}

export const addHomework = async (homeworkData) => {
  const { data, error } = await supabase
    .from('homeworks').insert(toSnake(homeworkData)).select().single()
  return row(data, error)
}

export const getHomeworksByClass = async (classId) => {
  const { data: sessions } = await supabase.from('sessions').select('id').eq('class_id', classId)
  if (!sessions?.length) return []
  const { data, error } = await supabase
    .from('homeworks').select('*').in('session_id', sessions.map(s => s.id))
  return rows(data, error)
}

export const getHomeworkStats = async (studentId, classId) => {
  const records = await getHomeworkByStudent(studentId, classId)
  const stats = { done: 0, inProgress: 0, notDone: 0, total: records.length }
  records.forEach(r => {
    if (r.progress === 'done') stats.done++
    else if (r.progress === 'in_progress') stats.inProgress++
    else stats.notDone++
  })
  return stats
}
