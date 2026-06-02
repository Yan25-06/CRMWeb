import { supabase } from '@/lib/supabase'
import { getUid } from './studentService'

const fromDB = (row) => row ? {
  id: row.id,
  name: row.name,
  level: row.level,
  maxStudents: row.max_students,
  courseType: row.course_type,
  scheduleDays: row.schedule_days,
  scheduleTime: row.schedule_time,
  startDate: row.start_date,
  createdAt: row.created_at,
  teacherName: row.teachers?.name || row.teachers?.email || null,
} : null

const toDB = (data) => ({
  name: data.name,
  level: data.level ?? null,
  max_students: data.maxStudents ?? null,
  course_type: data.courseType ?? null,
  schedule_days: data.scheduleDays ?? null,
  schedule_time: data.scheduleTime ?? null,
  start_date: data.startDate ?? null,
})

export const teacherService = {
  async getAll() {
    const { data, error } = await supabase
      .from('teachers')
      .select('id, name, email')
      .order('name')
    if (error) throw new Error(error.message)
    return data
  },
}

export const classService = {
  async getAll() {
    const { data, error } = await supabase
      .from('classes')
      .select('*, teachers(name, email)')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('classes')
      .select('*, teachers(name, email)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },

  async create(data) {
    const teacher_id = data.teacherId ?? await getUid()
    const { data: row, error } = await supabase
      .from('classes')
      .insert({ ...toDB(data), teacher_id })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  async update(id, data) {
    const { error } = await supabase
      .from('classes')
      .update(toDB(data))
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async remove(id) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
