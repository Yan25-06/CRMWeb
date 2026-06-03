import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id:          row.id,
  studentId:   row.student_id,
  classId:     row.class_id,
  date:        row.date,
  scores:      row.scores ?? {},
  tags:        row.tags ?? [],
  remark:      row.remark,
  advice:      row.advice,
  teacherName: row.teacher_name,
  absent:      row.absent,
  absentReason: row.absent_reason,
  createdAt:   row.created_at,
} : null

const toDB = (data) => ({
  student_id:   data.studentId,
  class_id:     data.classId,
  date:         data.date,
  scores:       data.scores && typeof data.scores === 'object' ? data.scores : {},
  tags:         Array.isArray(data.tags) ? data.tags : [],
  remark:       data.remark       ?? null,
  advice:       data.advice       ?? null,
  teacher_name: data.teacherName  ?? null,
  absent:       data.absent       ?? false,
  absent_reason: data.absentReason ?? null,
})

export const reviewService = {
  async getByStudent(studentId, classId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async getByClass(classId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('class_id', classId)
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async upsert(data) {
    const { data: row, error } = await supabase
      .from('reviews')
      .upsert(toDB(data), { onConflict: 'student_id,class_id,date' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },
}
