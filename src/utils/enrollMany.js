import { enrollmentService } from '@/services/enrollmentService'

// Ghi danh nhiều học sinh vào 1 lớp với cùng cấu hình học phí.
// fee = { feeType: 'monthly'|'course', monthlyFee: number|'', courseFee: number|'' }
// Trả về { ok: number, failed: Array<{ studentId, message }> }.
export async function enrollMany(studentIds, classId, fee) {
  const { feeType = 'monthly', monthlyFee = '', courseFee = '' } = fee || {}
  const results = await Promise.allSettled(
    studentIds.map(studentId =>
      enrollmentService.upsert({
        studentId,
        classId,
        status: 'active',
        feeType,
        monthlyFee: feeType === 'monthly' ? (Number(monthlyFee) || 0) : null,
        courseFee: feeType === 'course' ? (Number(courseFee) || 0) : null,
        goal: '',
        note: '',
        enrolledAt: new Date().toISOString(),
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
