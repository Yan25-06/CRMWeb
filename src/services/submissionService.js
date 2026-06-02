import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  hwAssignmentId: row.hw_assignment_id,
  studentId: row.student_id,
  submitted: row.submitted,
  score: row.score,
  comment: row.comment,
  gradedAt: row.graded_at,
} : null

export const submissionService = {
  // 3.1 — read by assignment or by student
  async getByAssignment(hwAssignmentId) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('hw_assignment_id', hwAssignmentId)
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async getByStudent(studentId) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', studentId)
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  // Bulk fetch for overview tables: all submissions for a class filtered by
  // assignment date range. Returns flat list of {studentId, submitted}.
  async getByClassRange(classId, fromDate, toDate) {
    const { data: assignments, error: aErr } = await supabase
      .from('hw_assignments')
      .select('id')
      .eq('class_id', classId)
      .gte('assigned_at', fromDate)
      .lte('assigned_at', toDate)
    if (aErr) throw new Error(aErr.message)
    if (!assignments || assignments.length === 0) return []
    const ids = assignments.map(a => a.id)
    const { data, error } = await supabase
      .from('submissions')
      .select('student_id, submitted')
      .in('hw_assignment_id', ids)
    if (error) throw new Error(error.message)
    return (data ?? []).map(row => ({ studentId: row.student_id, submitted: row.submitted }))
  },

  // 3.2 — upsert keyed on (hw_assignment_id, student_id); idempotent nộp/chấm
  async upsert(data) {
    const payload = {
      hw_assignment_id: data.hwAssignmentId,
      student_id: data.studentId,
      submitted: data.submitted ?? false,
      graded_at: new Date().toISOString(),
    }
    if (data.score !== undefined) payload.score = data.score
    if (data.comment !== undefined) payload.comment = data.comment
    const { data: row, error } = await supabase
      .from('submissions')
      .upsert(payload, { onConflict: 'hw_assignment_id,student_id' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  // 3.3 — manual bulk delete by assignment (cascade handles automatic deletion)
  async deleteByAssignment(hwAssignmentId) {
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('hw_assignment_id', hwAssignmentId)
    if (error) throw new Error(error.message)
  },
}
