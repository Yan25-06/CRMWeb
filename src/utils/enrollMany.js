import { enrollmentService } from '@/services/enrollmentService'

// Ghi danh nhiều học sinh vào 1 lớp với cùng mục tiêu/ghi chú.
// config = { goal, note, enrolledAt } — enrolledAt (ISO) mặc định là bây giờ.
// Trả về { ok: number, failed: Array<{ studentId, message }> }.
export async function enrollMany(studentIds, classId, config) {
  const { goal = '', note = '', enrolledAt } = config || {}
  const enrolledAtISO = enrolledAt || new Date().toISOString()
  const results = await Promise.allSettled(
    studentIds.map(studentId =>
      enrollmentService.upsert({
        studentId,
        classId,
        status: 'active',
        goal,
        note,
        enrolledAt: enrolledAtISO,
      })
    )
  )
  const failed = []
  let ok = 0
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') ok++
    else failed.push({ studentId: studentIds[i], message: r.reason?.message || 'Lỗi không xác định' })
  })
  return { ok, failed }
}
