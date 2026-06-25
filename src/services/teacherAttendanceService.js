import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  scheduleId: row.schedule_id,
  date: row.date,
  teacherId: row.teacher_id,
  status: row.status,
  note: row.note,
  substituteTeacherId: row.substitute_teacher_id ?? null,
  substituteConfirmed: row.substitute_confirmed ?? false,
  createdAt: row.created_at,
} : null

const toDB = (data) => ({
  schedule_id: data.scheduleId,
  date: data.date,
  teacher_id: data.teacherId,
  status: data.status,
  note: data.note ?? null,
  substitute_teacher_id: data.substituteTeacherId ?? null,
  substitute_confirmed: data.substituteConfirmed ?? false,
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
  async upsert({ scheduleId, date, teacherId, status, note, substituteTeacherId, substituteConfirmed }) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .upsert(toDB({ scheduleId, date, teacherId, status, note, substituteTeacherId, substituteConfirmed }), {
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

  // Buổi GV hiện tại (auth.uid) được giao dạy thay trong khoảng ngày.
  // Trả [{ id, scheduleId, date, substituteConfirmed, classId, className, room,
  //        startTime, endTime, mainTeacherName }]
  async getSubstituteAssignments(dateFrom, dateTo) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('teacher_attendance')
      .select(`
        id, schedule_id, date, substitute_confirmed,
        schedule:schedule_id (
          class_id, start_time, end_time, room,
          class:class_id ( name )
        ),
        mainTeacher:teacher_id ( name )
      `)
      .eq('substitute_teacher_id', user.id)
      .eq('status', 'absent')
      .gte('date', dateFrom)
      .lte('date', dateTo)
    if (error) throw new Error(error.message)
    return (data ?? []).map(r => ({
      id: r.id,
      scheduleId: r.schedule_id,
      date: r.date,
      substituteConfirmed: r.substitute_confirmed ?? false,
      classId: r.schedule?.class_id ?? null,
      className: r.schedule?.class?.name ?? '—',
      room: r.schedule?.room ?? null,
      startTime: r.schedule?.start_time ?? null,
      endTime: r.schedule?.end_time ?? null,
      mainTeacherName: r.mainTeacher?.name ?? '—',
    }))
  },

  // GV dạy thay xác nhận đã dạy — chỉ set substitute_confirmed.
  async confirmSubstitute(scheduleId, date, confirmed = true) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .update({ substitute_confirmed: confirmed })
      .eq('schedule_id', scheduleId)
      .eq('date', date)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },
}
