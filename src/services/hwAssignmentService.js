import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  classId: row.class_id,
  title: row.title,
  description: row.description,
  assignedAt: row.assigned_at,
  dueDate: row.due_date,
  createdAt: row.created_at,
} : null

const toDB = (data) => {
  const row = {}
  if (data.classId !== undefined) row.class_id = data.classId
  if (data.title !== undefined) row.title = data.title
  if (data.description !== undefined) row.description = data.description
  if (data.assignedAt !== undefined) row.assigned_at = data.assignedAt
  if (data.dueDate !== undefined) row.due_date = data.dueDate
  return row
}

export const hwAssignmentService = {
  // 2.1 — assignments for a class, newest first
  async getByClass(classId) {
    const { data, error } = await supabase
      .from('hw_assignments')
      .select('*')
      .eq('class_id', classId)
      .order('assigned_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  // 2.2 — create or update
  async create(data) {
    const { data: row, error } = await supabase
      .from('hw_assignments')
      .insert(toDB(data))
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  async update(id, data) {
    const { error } = await supabase
      .from('hw_assignments')
      .update(toDB(data))
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  // 2.3 — delete assignment; submissions cascade-delete via FK (on delete cascade in schema)
  async remove(id) {
    const { error } = await supabase
      .from('hw_assignments')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
