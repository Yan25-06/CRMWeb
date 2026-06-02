import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  sessionId: row.session_id,
  studentId: row.student_id,
  progress: row.progress,
  title: row.title,
  note: row.note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
} : null

const toDB = (data) => {
  const row = {}
  if (data.sessionId !== undefined) row.session_id = data.sessionId
  if (data.studentId !== undefined) row.student_id = data.studentId
  if (data.progress !== undefined) row.progress = data.progress
  if (data.title !== undefined) row.title = data.title
  if (data.note !== undefined) row.note = data.note
  return row
}

export const homeworkService = {
  // 1.1 — homework records for a session
  async getBySession(sessionId) {
    const { data, error } = await supabase
      .from('homeworks')
      .select('*')
      .eq('session_id', sessionId)
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  // 1.2 — all homework for a student within a class
  async getByStudent(studentId, classId) {
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id')
      .eq('class_id', classId)
    if (sessErr) throw new Error(sessErr.message)
    if (!sessions || sessions.length === 0) return []
    const sessionIds = sessions.map(s => s.id)
    const { data, error } = await supabase
      .from('homeworks')
      .select('*')
      .eq('student_id', studentId)
      .in('session_id', sessionIds)
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  // Insert a new homework record (e.g. stub for a student who has no record yet)
  async create(data) {
    const { data: row, error } = await supabase
      .from('homeworks')
      .insert(toDB(data))
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  // 1.3 — update progress/note on a single record
  async update(id, data) {
    const { data: row, error } = await supabase
      .from('homeworks')
      .update(toDB(data))
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  // 1.4 — set title for every homework record of a session in one query
  async updateSessionTitle(sessionId, title) {
    const { error } = await supabase
      .from('homeworks')
      .update({ title })
      .eq('session_id', sessionId)
    if (error) throw new Error(error.message)
  },

  // 1.5 — client-side stat summary from an already-fetched array
  getStats(homeworks) {
    const stats = { done: 0, inProgress: 0, notDone: 0, total: homeworks.length }
    homeworks.forEach(h => {
      if (h.progress === 'done' || h.progress === 100) stats.done++
      else if (h.progress === 'in_progress' || h.progress === 50) stats.inProgress++
      else stats.notDone++
    })
    return stats
  },

  // Used by HomeworkPanel (Reviews) — enriched with date/sessionTopic from session
  async getByRange(studentId, classId, fromDate, toDate) {
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id, date, topic')
      .eq('class_id', classId)
      .gte('date', fromDate)
      .lte('date', toDate)
    if (sessErr) throw new Error(sessErr.message)
    if (!sessions || sessions.length === 0) return []
    const sessionIds = sessions.map(s => s.id)
    const sessionMap = new Map(sessions.map(s => [s.id, s]))
    const { data, error } = await supabase
      .from('homeworks')
      .select('*')
      .eq('student_id', studentId)
      .in('session_id', sessionIds)
    if (error) throw new Error(error.message)
    return (data ?? [])
      .map(row => ({
        ...fromDB(row),
        date: sessionMap.get(row.session_id)?.date,
        sessionTopic: sessionMap.get(row.session_id)?.topic,
      }))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  },

  // Used by HomeworkTab session mode to compute per-student stats efficiently.
  // Fetches session IDs for the class first, then all homeworks in one query.
  async getByClass(classId) {
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id')
      .eq('class_id', classId)
    if (sessErr) throw new Error(sessErr.message)
    if (!sessions || sessions.length === 0) return []
    const sessionIds = sessions.map(s => s.id)
    const { data, error } = await supabase
      .from('homeworks')
      .select('*')
      .in('session_id', sessionIds)
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },
}
