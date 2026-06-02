import { supabase } from '@/lib/supabase'
import { rows, row, toSnake } from './_utils'

export const getSchedule = async () => {
  const { data, error } = await supabase.from('schedule').select('*')
  return rows(data, error)
}

export const getScheduleByDay = async (dayOfWeek) => {
  const { data, error } = await supabase
    .from('schedule').select('*').eq('day_of_week', dayOfWeek).order('start_time')
  return rows(data, error)
}

export const addScheduleItem = async (itemData) => {
  const { data, error } = await supabase.from('schedule').insert(toSnake(itemData)).select().single()
  return row(data, error)
}

export const updateScheduleItem = async (id, itemData) => {
  const { data, error } = await supabase
    .from('schedule').update(toSnake(itemData)).eq('id', id).select().single()
  return row(data, error)
}

export const deleteScheduleItem = async (id) => {
  const { error } = await supabase.from('schedule').delete().eq('id', id)
  if (error) throw error
}
