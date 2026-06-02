import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

export const getSubmissionsByAssignment = async (hwAssignmentId) => {
  const { data, error } = await supabase
    .from('submissions').select('*').eq('hw_assignment_id', hwAssignmentId)
  return rows(data, error)
}

export const getSubmissionsByStudent = async (studentId) => {
  const { data, error } = await supabase
    .from('submissions').select('*').eq('student_id', studentId)
  return rows(data, error)
}

export const getSubmissionsByAssignments = async (hwAssignmentIds) => {
  if (!hwAssignmentIds?.length) return []
  const { data, error } = await supabase
    .from('submissions').select('*').in('hw_assignment_id', hwAssignmentIds)
  return rows(data, error)
}

export const upsertSubmission = async (submissionData) => {
  const { data, error } = await supabase
    .from('submissions')
    .upsert(
      { ...toSnake(submissionData), graded_at: new Date().toISOString() },
      { onConflict: 'hw_assignment_id,student_id' }
    ).select().single()
  return row(data, error)
}
