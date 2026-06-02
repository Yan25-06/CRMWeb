import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

export const getSessionReviewsByStudent = async (studentId, classId) => {
  const { data, error } = await supabase
    .from('session_reviews').select('*')
    .eq('student_id', studentId).eq('class_id', classId)
    .order('created_at', { ascending: false })
  return rows(data, error)
}

export const addSessionReview = async (reviewData) => {
  const { data, error } = await supabase
    .from('session_reviews').insert(toSnake(reviewData)).select().single()
  return row(data, error)
}

export const upsertSessionReview = addSessionReview
