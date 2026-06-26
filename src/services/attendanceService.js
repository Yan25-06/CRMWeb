import { supabase } from '@/lib/supabase'
import { sessionService } from './sessionService'

const fromDB = (row) => row ? {
  id: row.id,
  sessionId: row.session_id,
  studentId: row.student_id,
  date: row.date,
  present: row.present,
  note: row.note,
} : null

export const attendanceService = {
  async getBySession(sessionId) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('session_id', sessionId)
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async getByStudent(studentId) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  // All attendance for a class's sessions — lets callers compute per-student
  // stats from a single fetch instead of one round-trip per student.
  async getByClass(classId) {
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id')
      .eq('class_id', classId)
    if (sessErr) throw new Error(sessErr.message)
    if (!sessions || sessions.length === 0) return []
    const sessionIds = sessions.map(s => s.id)
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .in('session_id', sessionIds)
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  // Attendance for a student within a class, scoped by session date range.
  async getByRange(studentId, classId, fromDate, toDate) {
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id, date')
      .eq('class_id', classId)
      .gte('date', fromDate)
      .lte('date', toDate)
    if (sessErr) throw new Error(sessErr.message)
    if (!sessions || sessions.length === 0) return []
    const sessionIds = sessions.map(s => s.id)
    const dateMap = new Map(sessions.map(s => [s.id, s.date]))
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .in('session_id', sessionIds)
    if (error) throw new Error(error.message)
    return (data ?? [])
      .map(row => fromDB({ ...row, date: dateMap.get(row.session_id) ?? row.date }))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  },

  // Upsert one attendance cell keyed on (session_id, student_id).
  // Default present (mặc định có mặt); `note` only written when provided so a
  // present-only toggle keeps any existing note.
  async upsert(record) {
    const payload = {
      session_id: record.sessionId,
      student_id: record.studentId,
      date: record.date,
      present: record.present ?? true,
    }
    if (record.note !== undefined) payload.note = record.note
    const { data, error } = await supabase
      .from('attendance')
      .upsert(payload, { onConflict: 'session_id,student_id' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },

  // Bulk fetch for overview tables. Returns { sessionCount, records }
  // where records are only the explicit absent/present entries (default = present).
  // Callers use sessionCount as denominator: (sessionCount - absentCount) / sessionCount.
  async getByClassRange(classId, fromDate, toDate) {
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id')
      .eq('class_id', classId)
      .gte('date', fromDate)
      .lte('date', toDate)
    if (sessErr) throw new Error(sessErr.message)
    if (!sessions || sessions.length === 0) return { sessionCount: 0, records: [] }
    const sessionIds = sessions.map(s => s.id)
    const { data, error } = await supabase
      .from('attendance')
      .select('student_id, present')
      .in('session_id', sessionIds)
    if (error) throw new Error(error.message)
    return {
      sessionCount: sessions.length,
      records: (data ?? []).map(row => ({ studentId: row.student_id, present: row.present })),
    }
  },

  // Derived: attendance rate (%) over past sessions of a class. null if none.
  async getRate(studentId, classId) {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const [sessions, records] = await Promise.all([
      sessionService.getByClass(classId),
      this.getByStudent(studentId),
    ])
    const pastSessions = sessions.filter(s => s.date <= today)
    if (pastSessions.length === 0) return null
    const sessionIds = new Set(pastSessions.map(s => s.id))
    // Mặc định có mặt: chỉ bản ghi present === false mới tính là vắng.
    const absentCount = records.filter(r => sessionIds.has(r.sessionId) && r.present === false).length
    return Math.round(((pastSessions.length - absentCount) / pastSessions.length) * 100)
  },

  async getRateByRange(studentId, classId, fromDate, toDate) {
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id')
      .eq('class_id', classId)
      .gte('date', fromDate)
      .lte('date', toDate)
    if (sessErr) throw new Error(sessErr.message)
    const total = (sessions ?? []).length
    if (total === 0) return null
    const sessionIds = sessions.map(s => s.id)
    const { data, error } = await supabase
      .from('attendance')
      .select('present')
      .eq('student_id', studentId)
      .in('session_id', sessionIds)
    if (error) throw new Error(error.message)
    const absent = (data ?? []).filter(r => r.present === false).length
    const present = total - absent
    return { present, total, pct: Math.round((present / total) * 1000) / 10 }
  },
}
