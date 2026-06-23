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

  // Đồng bộ lịch dạy của một lớp theo lịch học có cấu trúc.
  // Chỉ chạy khi đủ dayList + startTime + endTime; dayList rỗng → no-op (không xóa oan).
  async syncForClass(classId, { dayList, startTime, endTime, room }) {
    if (!classId || !Array.isArray(dayList) || dayList.length === 0 || !startTime || !endTime) return
    const wanted = new Set(dayList.map(Number))

    const { data: existing, error: selErr } = await supabase
      .from('schedule')
      .select('id, day_of_week, note')
      .eq('class_id', classId)
    if (selErr) throw new Error(selErr.message)

    const existingByDay = new Map((existing ?? []).map(r => [r.day_of_week, r]))

    // Upsert các thứ được chọn (giữ nguyên note nếu đã có)
    for (const day of wanted) {
      const found = existingByDay.get(day)
      if (found) {
        const { error } = await supabase
          .from('schedule')
          .update({ start_time: startTime, end_time: endTime, room: room ?? null })
          .eq('id', found.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('schedule')
          .insert({ class_id: classId, day_of_week: day, start_time: startTime, end_time: endTime, room: room ?? null, note: null })
        if (error) throw new Error(error.message)
      }
    }

    // Xóa các thứ không còn được chọn
    const toDelete = (existing ?? []).filter(r => !wanted.has(r.day_of_week)).map(r => r.id)
    if (toDelete.length > 0) {
      const { error } = await supabase.from('schedule').delete().in('id', toDelete)
      if (error) throw new Error(error.message)
    }
  },
}
