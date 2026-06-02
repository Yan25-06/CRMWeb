import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  classId: row.class_id,
  dayOfWeek: row.day_of_week,
  startTime: row.start_time,
  endTime: row.end_time,
  room: row.room,
  note: row.note,
} : null

const toDB = (data) => ({
  class_id: data.classId,
  day_of_week: data.dayOfWeek,
  start_time: data.startTime,
  end_time: data.endTime,
  room: data.room ?? null,
  note: data.note ?? null,
})

export const scheduleService = {
  async getAll() {
    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .order('day_of_week')
      .order('start_time')
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async getByDay(dayOfWeek) {
    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .order('start_time')
    if (error) throw new Error(error.message)
    return data.map(fromDB)
  },

  async add(data) {
    const { data: row, error } = await supabase
      .from('schedule')
      .insert(toDB(data))
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  async update(id, data) {
    const { error } = await supabase
      .from('schedule')
      .update(toDB(data))
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async remove(id) {
    const { error } = await supabase
      .from('schedule')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
