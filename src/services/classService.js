import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

export const getClasses = async () => {
  const { data, error } = await supabase.from('classes').select('*').order('created_at', { ascending: false })
  return rows(data, error)
}

export const getClassById = async (id) => {
  const { data, error } = await supabase.from('classes').select('*').eq('id', id).single()
  return row(data, error)
}

// Admin only — creates a class and assigns to a teacher
export const addClass = async (classData) => {
  const { data, error } = await supabase.from('classes').insert(toSnake(classData)).select().single()
  return row(data, error)
}

export const updateClass = async (id, classData) => {
  const { data, error } = await supabase
    .from('classes').update(toSnake(classData)).eq('id', id).select().single()
  return row(data, error)
}

export const deleteClass = async (id) => {
  const { error } = await supabase.from('classes').delete().eq('id', id)
  if (error) throw error
}
