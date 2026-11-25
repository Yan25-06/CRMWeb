import { supabase } from '@/lib/supabase'
import { sessionService } from './sessionService'
import { summarizeAttendance, todayKey } from '@/utils/attendance'

// Ngày vào lớp / nghỉ của 1 học sinh trong 1 lớp — dùng để chỉ tính chuyên cần
// trên các buổi học sinh thực sự ở trong lớp (xem utils/attendance.js).
const getEnrollmentDates = async (studentId, classId) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('enrolled_at, dropped_at')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? { enrolledAt: data.enrolled_at, droppedAt: data.dropped_at } : null
}

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

  // Bulk fetch for overview tables. Returns { sessions, records, enrollments }:
  // sessions [{ id, date }] trong khoảng, records chỉ gồm bản ghi tường minh
  // (thiếu = có mặt), enrollments [{ studentId, enrolledAt, droppedAt }] để
  // caller giới hạn mẫu số theo ngày vào lớp qua `summarizeAttendance`.
  async getByClassRange(classId, fromDate, toDate) {
    const [{ data: sessions, error: sessErr }, { data: enrolls, error: enrErr }] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, date')
        .eq('class_id', classId)
        .gte('date', fromDate)
        .lte('date', toDate),
      supabase
        .from('enrollments')
        .select('student_id, enrolled_at, dropped_at')
        .eq('class_id', classId),
    ])
    if (sessErr) throw new Error(sessErr.message)
    if (enrErr) throw new Error(enrErr.message)
    const enrollments = (enrolls ?? []).map(e => ({
      studentId: e.student_id, enrolledAt: e.enrolled_at, droppedAt: e.dropped_at,
    }))
    if (!sessions || sessions.length === 0) return { sessions: [], records: [], enrollments }
    const sessionIds = sessions.map(s => s.id)
    const { data, error } = await supabase
      .from('attendance')
      .select('session_id, student_id, present')
      .in('session_id', sessionIds)
    if (error) throw new Error(error.message)
    return {
      sessions,
      records: (data ?? []).map(row => ({
        sessionId: row.session_id, studentId: row.student_id, present: row.present,
      })),
      enrollments,
    }
  },

  // Derived: attendance rate (%) over past sessions of a class, chỉ tính các buổi
  // từ ngày vào lớp. null nếu chưa có buổi nào áp dụng.
  async getRate(studentId, classId) {
    const today = todayKey()
    const [sessions, records, enrollment] = await Promise.all([
      sessionService.getByClass(classId),
      this.getByStudent(studentId),
      getEnrollmentDates(studentId, classId),
    ])
    const pastSessions = sessions.filter(s => s.date <= today)
    const bySession = new Map(records.map(r => [r.sessionId, r]))
    const { rate } = summarizeAttendance(pastSessions, enrollment, id => bySession.get(id))
    return rate === null ? null : Math.round(rate * 100)
  },

  async getRateByRange(studentId, classId, fromDate, toDate) {
    const [{ data: sessions, error: sessErr }, enrollment] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, date')
        .eq('class_id', classId)
        .gte('date', fromDate)
        .lte('date', toDate),
      getEnrollmentDates(studentId, classId),
    ])
    if (sessErr) throw new Error(sessErr.message)
    if (!sessions || sessions.length === 0) return null
    const { data, error } = await supabase
      .from('attendance')
      .select('session_id, present')
      .eq('student_id', studentId)
      .in('session_id', sessions.map(s => s.id))
    if (error) throw new Error(error.message)
    const bySession = new Map((data ?? []).map(r => [r.session_id, r]))
    const { present, total, rate, absentDates } =
      summarizeAttendance(sessions, enrollment, id => bySession.get(id))
    if (total === 0) return null
    return { present, total, pct: Math.round(rate * 1000) / 10, absentDates }
  },
}
