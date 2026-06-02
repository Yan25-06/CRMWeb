import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id:        row.id,
  studentId: row.student_id,
  classId:   row.class_id,
  sessionId: row.session_id,
  text:      row.text,
  createdAt: row.created_at,
} : null

const toDB = (data) => ({
  student_id: data.studentId,
  class_id:   data.classId,
  session_id: data.sessionId ?? null,
  text:       data.text,
})

export const sessionReviewService = {
  async getByStudent(studentId, classId) {
    const { data, error } = await supabase
      .from('session_reviews')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async add(data) {
    const { data: row, error } = await supabase
      .from('session_reviews')
      .insert(toDB(data))
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },
}
