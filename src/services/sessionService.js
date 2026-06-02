import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  classId: row.class_id,
  date: row.date,
  startTime: row.start_time,
  endTime: row.end_time,
  scheduleItemId: row.schedule_item_id,
  createdManually: row.created_manually,
  topic: row.topic,
  note: row.note,
  createdAt: row.created_at,
} : null

// Only map fields that are present so partial updates don't null out columns
const toDB = (data) => {
  const row = {}
  if (data.classId !== undefined) row.class_id = data.classId
  if (data.date !== undefined) row.date = data.date
  if (data.startTime !== undefined) row.start_time = data.startTime
  if (data.endTime !== undefined) row.end_time = data.endTime
  if (data.scheduleItemId !== undefined) row.schedule_item_id = data.scheduleItemId
  if (data.topic !== undefined) row.topic = data.topic
  if (data.note !== undefined) row.note = data.note
  return row
}

export const sessionService = {
  async getByClass(classId) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('class_id', classId)
      .order('date', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },

  async create(data) {
    const { data: row, error } = await supabase
      .from('sessions')
      .insert(toDB(data))
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  async update(id, data) {
    const { error } = await supabase
      .from('sessions')
      .update(toDB(data))
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async remove(id) {
    // attendance rows cascade-delete via the sessions FK (see migration 0003)
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
