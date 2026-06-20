import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  scheduleId: row.schedule_id,
  date: row.date,
  teacherId: row.teacher_id,
  status: row.status,
  note: row.note,
  createdAt: row.created_at,
} : null

const toDB = (data) => ({
  schedule_id: data.scheduleId,
  date: data.date,
  teacher_id: data.teacherId,
  status: data.status,
  note: data.note ?? null,
})

export const teacherAttendanceService = {
  // Lấy mọi record trong khoảng ngày (dùng cho 1 tuần). dateFrom/dateTo: 'YYYY-MM-DD'
  async getByWeek(dateFrom, dateTo) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo)
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  // Tạo hoặc cập nhật record theo (schedule_id, date).
  async upsert({ scheduleId, date, teacherId, status, note }) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .upsert(toDB({ scheduleId, date, teacherId, status, note }), {
        onConflict: 'schedule_id,date',
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },

  async remove(scheduleId, date) {
    const { error } = await supabase
      .from('teacher_attendance')
      .delete()
      .eq('schedule_id', scheduleId)
      .eq('date', date)
    if (error) throw new Error(error.message)
  },
}
