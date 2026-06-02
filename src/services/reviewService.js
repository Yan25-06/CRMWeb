import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

export const getReviewsByStudent = async (studentId, classId) => {
  const { data, error } = await supabase
    .from('reviews').select('*')
    .eq('student_id', studentId).eq('class_id', classId)
    .order('date', { ascending: false })
  return rows(data, error)
}

export const upsertReview = async (reviewData) => {
  const { data, error } = await supabase
    .from('reviews')
    .upsert(toSnake(reviewData), { onConflict: 'student_id,class_id,date' })
    .select().single()
  return row(data, error)
}
