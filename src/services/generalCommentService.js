import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id:        row.id,
  studentId: row.student_id,
  classId:   row.class_id,
  text:      row.text,
  updatedAt: row.updated_at,
} : null

export const generalCommentService = {
  async get(studentId, classId) {
    const { data, error } = await supabase
      .from('general_comments')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },

  async upsert(studentId, classId, text) {
    const { data: row, error } = await supabase
      .from('general_comments')
      .upsert(
        { student_id: studentId, class_id: classId, text },
        { onConflict: 'student_id,class_id' }
      )
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },
}
