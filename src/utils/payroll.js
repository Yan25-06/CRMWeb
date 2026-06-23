// Tính lương giáo viên theo tháng — hàm THUẦN (không gọi supabase).
// Công thức (spec 2026-06-22):
//   rate (đơn giá/buổi) = monthlySalary / scheduled  (scheduled>0 else 0)
//   actualPay = rate * (taught + subs)
//   taught = scheduled - absent ; subs = số buổi GV dạy thay cho người khác.

// Số lần một thứ (0=CN..6=T7) xuất hiện trong tháng year/month(1-12).
export function countWeekdayOccurrences(year, month, dayOfWeek) {
  const daysInMonth = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() === dayOfWeek) count++
  }
  return count
}

// teachers: [{ id, name, email, monthlySalary }]
// classes:  [{ id, teacherId }]
// schedule: [{ id, classId, dayOfWeek }]
// attendance: [{ scheduleId, teacherId, status, substituteTeacherId }] (đã lọc theo tháng)
// Trả: [{ teacherId, name, base, scheduled, absent, taught, subs, rate, actualPay }]
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

  // absent theo giáo viên (record status='absent' của chính họ)
  const absentByTeacher = new Map()
  // subs theo giáo viên (record có substituteTeacherId = họ)
  const subsByTeacher = new Map()
  for (const a of attendance) {
    if (a.status === 'absent') {
      absentByTeacher.set(a.teacherId, (absentByTeacher.get(a.teacherId) ?? 0) + 1)
      if (a.substituteTeacherId) {
        subsByTeacher.set(a.substituteTeacherId, (subsByTeacher.get(a.substituteTeacherId) ?? 0) + 1)
      }
    }
  }

  return teachers.map(t => {
    const base = t.monthlySalary ?? 0
    const scheduled = scheduledByTeacher.get(t.id) ?? 0
    const absent = absentByTeacher.get(t.id) ?? 0
    const taught = Math.max(0, scheduled - absent)
    const subs = subsByTeacher.get(t.id) ?? 0
    const rate = scheduled > 0 ? base / scheduled : 0
    const actualPay = Math.round(rate * (taught + subs))
    return {
      teacherId: t.id,
      name: t.name || t.email || '—',
      base,
      scheduled,
      absent,
      taught,
      subs,
      rate: Math.round(rate),
      actualPay,
    }
  })
}
