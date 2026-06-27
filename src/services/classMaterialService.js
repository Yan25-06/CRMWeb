import { supabase } from '@/lib/supabase'
import { getUid } from './studentService'

const fromDB = (row) => row ? {
  id: row.id,
  classId: row.class_id,
  title: row.title,
  url: row.url,
  type: row.type,
  createdBy: row.created_by,
  createdAt: row.created_at,
} : null

const toDB = (data) => {
  const row = {}
  if (data.classId !== undefined) row.class_id = data.classId
  if (data.title !== undefined) row.title = data.title
  if (data.url !== undefined) row.url = data.url
  if (data.type !== undefined) row.type = data.type
  return row
}

export const classMaterialService = {
  async getByClass(classId) {
    const { data, error } = await supabase
      .from('class_materials')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  async create(data) {
    const created_by = await getUid()
    const { data: row, error } = await supabase
      .from('class_materials')
      .insert({ ...toDB(data), created_by })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  async update(id, data) {
    const { data: row, error } = await supabase
      .from('class_materials')
      .update(toDB(data))
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  async remove(id) {
    const { error } = await supabase
      .from('class_materials')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
