import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

export const getAllPayments = async () => {
  const { data, error } = await supabase.from('payments').select('*').order('paid_at', { ascending: false })
  return rows(data, error)
}

export const getPaymentsByStudent = async (studentId) => {
  const { data, error } = await supabase
    .from('payments').select('*').eq('student_id', studentId).order('paid_at', { ascending: false })
  return rows(data, error)
}

export const getPaymentsByPeriod = async (period) => {
  const { data, error } = await supabase.from('payments').select('*').eq('period', period)
  return rows(data, error)
}

export const getPaidAmountByStudentPeriod = async (studentId, period) => {
  const { data } = await supabase
    .from('payments').select('amount').eq('student_id', studentId).eq('period', period)
  return (data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)
}

export const createPayment = async (paymentData) => {
  const { data, error } = await supabase.from('payments').insert(toSnake(paymentData)).select().single()
  return row(data, error)
}

export const deletePayment = async (id) => {
  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) throw error
}
