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
    const { data, error } = await supabase
      .from('attendance')
      .select('*, sessions!inner(class_id)')
      .eq('sessions.class_id', classId)
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  // Attendance for a student within a class, scoped by session date range.
  async getByRange(studentId, classId, fromDate, toDate) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, sessions!inner(class_id, date)')
      .eq('student_id', studentId)
      .eq('sessions.class_id', classId)
      .gte('sessions.date', fromDate)
      .lte('sessions.date', toDate)
    if (error) throw new Error(error.message)
    return data.map(fromDB).sort((a, b) => b.date.localeCompare(a.date))
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

  // Derived: attendance rate (%) over past sessions of a class. null if none.
  async getRate(studentId, classId) {
    const today = new Date().toISOString().split('T')[0]
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
}
