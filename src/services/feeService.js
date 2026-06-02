import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'
import { countSessions } from './attendanceService'

export const getFees = async () => {
  const { data, error } = await supabase.from('fees').select('*')
  return rows(data, error)
}

export const getFeeByStudentMonth = async (studentId, year, month) => {
  const { data, error } = await supabase
    .from('fees').select('*').eq('student_id', studentId).eq('year', year).eq('month', month).maybeSingle()
  return row(data, error)
}

export const upsertFee = async (feeData) => {
  const { data, error } = await supabase
    .from('fees')
    .upsert(toSnake(feeData), { onConflict: 'student_id,year,month' })
    .select().single()
  return row(data, error)
}

// Calculate fee: Σ(sessions_attended × feePerSession per enrollment) + surcharge
export const calcFee = async (studentId, year, month) => {
  const feeRec = await getFeeByStudentMonth(studentId, year, month)
  const surcharge = feeRec?.surcharge ?? 0

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('class_id, fee_per_session')
    .eq('student_id', studentId)
    .neq('status', 'dropped')

  if (!enrollments?.length) return surcharge

  const sessionCounts = await Promise.all(
    enrollments.map(e => countSessions(studentId, year, month, e.class_id).then(n => n * e.fee_per_session))
  )
  return sessionCounts.reduce((sum, v) => sum + v, 0) + surcharge
}

export const isFeePaid = async (studentId, year, month) => {
  const period = `${year}-${String(month).padStart(2, '0')}`
  const { data } = await supabase
    .from('payments')
    .select('amount')
    .eq('student_id', studentId)
    .eq('period', period)

  const totalPaid = (data ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalFee  = await calcFee(studentId, year, month)
  return totalFee > 0 && totalPaid >= totalFee
}
