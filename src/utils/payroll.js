// Tính lương giáo viên theo BUỔI — hàm THUẦN (không gọi supabase).
// Công thức (spec 2026-06-27, per-session model):
//   rate (đơn giá/buổi) = sessionRate (admin nhập trực tiếp)
//   actualPay = rate * (taught + subs)
//   taught = đếm record status='present' (opt-in: chỉ xác nhận dạy mới tính)
//   subs = đếm dạy thay đã xác nhận (substituteConfirmed=true), theo rate của
//          chính người dạy thay.
//   scheduled = số buổi theo lịch trong tháng (chỉ để hiển thị tham khảo).

// Số lần một thứ (0=CN..6=T7) xuất hiện trong tháng year/month(1-12).
export function countWeekdayOccurrences(year, month, dayOfWeek) {
  const daysInMonth = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() === dayOfWeek) count++
  }
  return count
}

// teachers: [{ id, name, email, sessionRate }]
// classes:  [{ id, teacherId }]
// schedule: [{ id, classId, dayOfWeek }]
// attendance: [{ scheduleId, teacherId, status, substituteTeacherId }] (đã lọc theo tháng)
// Trả: [{ teacherId, name, scheduled, absent, taught, subs, rate, actualPay }]
export function buildPayrollRows({ year, month, teachers, classes, schedule, attendance }) {
  const classTeacher = new Map(classes.map(c => [c.id, c.teacherId]))
  // scheduleId -> teacherId phụ trách (qua lớp)
  const scheduleTeacher = new Map(
    schedule.map(s => [s.id, classTeacher.get(s.classId) ?? null])
  )

  // scheduled theo giáo viên = tổng số lần xuất hiện trong tháng của các ca thuộc lớp họ dạy
  const scheduledByTeacher = new Map()
  for (const s of schedule) {
    const tid = scheduleTeacher.get(s.id)
    if (!tid) continue
    const occ = countWeekdayOccurrences(year, month, s.dayOfWeek)
    scheduledByTeacher.set(tid, (scheduledByTeacher.get(tid) ?? 0) + occ)
  }

  // taught theo GV = số record status='present' của chính họ (opt-in: xác nhận dạy).
  const taughtByTeacher = new Map()
  const absentByTeacher = new Map()
  // subs theo GV = số record substituteTeacherId=họ VÀ đã xác nhận dạy thay (opt-in).
  const subsByTeacher = new Map()
  for (const a of attendance) {
    if (a.status === 'present') {
      taughtByTeacher.set(a.teacherId, (taughtByTeacher.get(a.teacherId) ?? 0) + 1)
    }
    if (a.status === 'absent') {
      absentByTeacher.set(a.teacherId, (absentByTeacher.get(a.teacherId) ?? 0) + 1)
      if (a.substituteTeacherId && a.substituteConfirmed) {
        subsByTeacher.set(a.substituteTeacherId, (subsByTeacher.get(a.substituteTeacherId) ?? 0) + 1)
      }
    }
  }

  return teachers.map(t => {
    const rate = t.sessionRate ?? 0
    const scheduled = scheduledByTeacher.get(t.id) ?? 0
    const absent = absentByTeacher.get(t.id) ?? 0
    const taught = taughtByTeacher.get(t.id) ?? 0
    const subs = subsByTeacher.get(t.id) ?? 0
    const actualPay = Math.round(rate * (taught + subs))
    return {
      teacherId: t.id,
      name: t.name || t.email || '—',
      scheduled,
      absent,
      taught,
      subs,
      rate: Math.round(rate),
      actualPay,
    }
  })
}
