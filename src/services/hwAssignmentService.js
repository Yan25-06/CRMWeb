import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

export const getHwAssignmentsByClass = async (classId) => {
  const { data, error } = await supabase
    .from('hw_assignments').select('*').eq('class_id', classId).order('assigned_at', { ascending: false })
  return rows(data, error)
}

export const createHwAssignment = async (data) => {
  const { data: created, error } = await supabase
    .from('hw_assignments').insert(toSnake(data)).select().single()
  return row(created, error)
}

export const updateHwAssignment = async (id, data) => {
  const { data: updated, error } = await supabase
    .from('hw_assignments').update(toSnake(data)).eq('id', id).select().single()
  return row(updated, error)
}

export const deleteHwAssignment = async (id) => {
  // Cascade deletes submissions via FK ON DELETE CASCADE
  const { error } = await supabase.from('hw_assignments').delete().eq('id', id)
  if (error) throw error
}
