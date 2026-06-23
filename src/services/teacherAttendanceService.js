import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  scheduleId: row.schedule_id,
  date: row.date,
  teacherId: row.teacher_id,
  status: row.status,
  note: row.note,
  substituteTeacherId: row.substitute_teacher_id ?? null,
  createdAt: row.created_at,
} : null

const toDB = (data) => ({
  schedule_id: data.scheduleId,
  date: data.date,
  teacher_id: data.teacherId,
  status: data.status,
  note: data.note ?? null,
  substitute_teacher_id: data.substituteTeacherId ?? null,
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

  // Lấy mọi record trong một tháng (year + month 1-12) cho bảng lương.
  async getByMonth(year, month) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data, error } = await supabase
      .from('teacher_attendance')
      .select('*')
      .gte('date', from)
      .lte('date', to)
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  // Tạo hoặc cập nhật record theo (schedule_id, date).
  async upsert({ scheduleId, date, teacherId, status, note, substituteTeacherId }) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .upsert(toDB({ scheduleId, date, teacherId, status, note, substituteTeacherId }), {
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
