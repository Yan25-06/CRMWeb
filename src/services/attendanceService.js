import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

export const getAttendanceBySession = async (sessionId) => {
  const { data, error } = await supabase.from('attendance').select('*').eq('session_id', sessionId)
  return rows(data, error)
}

export const getAttendanceByStudent = async (studentId) => {
  const { data, error } = await supabase.from('attendance').select('*').eq('student_id', studentId)
  return rows(data, error)
}

export const getAttendanceByMonth = async (year, month) => {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  const { data, error } = await supabase
    .from('attendance').select('*').gte('date', `${prefix}-01`).lte('date', `${prefix}-31`)
  return rows(data, error)
}

export const getAttendanceByRange = async (studentId, classId, fromDate, toDate) => {
  const { data: sessionIds } = await supabase
    .from('sessions')
    .select('id')
    .eq('class_id', classId)
    .gte('date', fromDate)
    .lte('date', toDate)

  if (!sessionIds?.length) return []

  const ids = sessionIds.map(s => s.id)
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .in('session_id', ids)
    .order('date', { ascending: false })
  return rows(data, error)
}

export const getAttendanceByClass = async (classId) => {
  const { data: sessions } = await supabase.from('sessions').select('id').eq('class_id', classId)
  if (!sessions?.length) return []
  const { data, error } = await supabase
    .from('attendance').select('*').in('session_id', sessions.map(s => s.id))
  return rows(data, error)
}

export const upsertAttendanceBySession = async (sessionId, studentId, present, note) => {
  const { data: session } = await supabase.from('sessions').select('date').eq('id', sessionId).single()
  if (!session) return null

  const { data, error } = await supabase.from('attendance').upsert(
    { session_id: sessionId, student_id: studentId, date: session.date, present, ...(note !== undefined ? { note } : {}) },
    { onConflict: 'session_id,student_id' }
  ).select().single()
  return row(data, error)
}

export const upsertAttendance = async (records) => {
  const payload = records.map(r => {
    const { classId: _, ...rest } = r
    return toSnake(rest)
  })
  const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'session_id,student_id' })
  if (error) throw error
}

export const getAttendanceRate = async (studentId, classId) => {
  const today = new Date().toISOString().split('T')[0]
  const { data: sessions } = await supabase
    .from('sessions').select('id').eq('class_id', classId).lte('date', today)

  if (!sessions?.length) return null
  const sessionIds = sessions.map(s => s.id)

  const { data: atts } = await supabase
    .from('attendance')
    .select('present')
    .eq('student_id', studentId)
    .in('session_id', sessionIds)

  const presentCount = (atts ?? []).filter(a => a.present).length
  return Math.round((presentCount / sessions.length) * 100)
}

export const countSessions = async (studentId, year, month, classId = null) => {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  if (classId) {
    const { data: sessions } = await supabase
      .from('sessions').select('id').eq('class_id', classId)
      .gte('date', `${prefix}-01`).lte('date', `${prefix}-31`)
    if (!sessions?.length) return 0
    const { data } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('present', true)
      .in('session_id', sessions.map(s => s.id))
    return data ?? 0
  }
  const { count } = await supabase
    .from('attendance')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('present', true)
    .gte('date', `${prefix}-01`)
    .lte('date', `${prefix}-31`)
  return count ?? 0
}
