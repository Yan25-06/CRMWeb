import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  studentId: row.student_id,
  classId: row.class_id,
  status: row.status,
  feeType: row.fee_type ?? 'monthly',
  monthlyFee: row.monthly_fee,
  courseFee: row.course_fee,
  goal: row.goal,
  note: row.note,
  enrolledAt: row.enrolled_at,
  pausedAt: row.paused_at,
  droppedAt: row.dropped_at,
  student: row.students ? {
    id: row.students.id,
    name: row.students.name,
    grade: row.students.grade,
    phone: row.students.phone,
    createdAt: row.students.created_at,
  } : undefined,
} : null

const toDB = (data) => ({
  student_id: data.studentId,
  class_id: data.classId,
  status: data.status,
  fee_type: data.feeType ?? 'monthly',
  monthly_fee: data.monthlyFee ?? null,
  course_fee: data.courseFee ?? null,
  goal: data.goal ?? null,
  note: data.note ?? null,
  enrolled_at: data.enrolledAt ?? undefined,
  paused_at: data.pausedAt ?? null,
  dropped_at: data.droppedAt ?? null,
})

export const enrollmentService = {
  async getAll() {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async getByClass(classId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('class_id', classId)
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async getActiveByClass(classId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, students(*)')
      .eq('class_id', classId)
      .eq('status', 'active')
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async get(studentId, classId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },

  async getAllForTeacher() {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async upsert(data) {
    const payload = toDB(data)
    if (!payload.enrolled_at) {
      payload.enrolled_at = new Date().toISOString()
    }
    const { data: row, error } = await supabase
      .from('enrollments')
      .upsert(payload, { onConflict: 'student_id,class_id' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },
}
