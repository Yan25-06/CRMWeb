import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  classId: row.class_id,
  title: row.title,
  date: row.date,
  sections: row.sections,
  teacherNote: row.teacher_note,
  createdAt: row.created_at,
} : null

const toDB = (data) => ({
  class_id: data.classId,
  title: data.title,
  date: data.date,
  sections: data.sections ?? [],
  teacher_note: data.teacherNote ?? null,
})

export const mockTestService = {
  async getByClass(classId) {
    const { data, error } = await supabase
      .from('mock_tests')
      .select('*')
      .eq('class_id', classId)
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  async getAll() {
    const { data, error } = await supabase
      .from('mock_tests')
      .select('*')
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  async create(data) {
    const { data: row, error } = await supabase
      .from('mock_tests')
      .insert(toDB(data))
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  async update(id, data) {
    const { data: row, error } = await supabase
      .from('mock_tests')
      .update(toDB(data))
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  async remove(id) {
    const { error } = await supabase
      .from('mock_tests')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
