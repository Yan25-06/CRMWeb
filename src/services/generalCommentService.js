import { supabase } from '@/lib/supabase'
import { row, toSnake } from './_utils'

export const getGeneralComment = async (studentId, classId) => {
  const { data, error } = await supabase
    .from('general_comments').select('*')
    .eq('student_id', studentId).eq('class_id', classId).maybeSingle()
  return row(data, error)
}

export const upsertGeneralComment = async (studentId, classId, text) => {
  const { data, error } = await supabase
    .from('general_comments')
    .upsert(
      { student_id: studentId, class_id: classId, text, updated_at: new Date().toISOString() },
      { onConflict: 'student_id,class_id' }
    ).select().single()
  return row(data, error)
}
