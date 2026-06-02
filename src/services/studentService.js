import { supabase } from '@/lib/supabase'
import { rows, row, toSnake, currentUserId } from './_utils'

export const getStudents = async () => {
  const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false })
  return rows(data, error)
}

export const getStudentById = async (id) => {
  const { data, error } = await supabase.from('students').select('*').eq('id', id).single()
  return row(data, error)
}

export const addStudent = async (studentData) => {
  const teacherId = await currentUserId()
  const { data, error } = await supabase
    .from('students').insert({ ...toSnake(studentData), teacher_id: teacherId }).select().single()
  return row(data, error)
}

export const updateStudent = async (id, studentData) => {
  const { data, error } = await supabase
    .from('students').update(toSnake(studentData)).eq('id', id).select().single()
  return row(data, error)
}

export const deleteStudent = async (id) => {
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw error
}
