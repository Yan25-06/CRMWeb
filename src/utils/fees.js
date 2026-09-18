// Logic thuần cho trang Học phí — KHÔNG import React/supabase để test bằng Node.
// FeeRow = { studentId, classId, name, className, monthlyFee, paid }

export function filterFeeRows(rows, { className = 'all', status = 'all' } = {}) {
  return (rows ?? []).filter(r => {
    if (className !== 'all' && r.className !== className) return false
    if (status === 'paid' && !r.paid) return false
    if (status === 'debt' && r.paid) return false
    return true
  })
}

// Đếm theo HỌC SINH DUY NHẤT, không theo dòng lớp: một học sinh học nhiều lớp
// chỉ tính "đã đóng đủ" khi mọi lớp đều đã tick.
export function countFeeStudents(rows) {
  const paidByStudent = new Map()
  for (const r of rows ?? []) {
    const prev = paidByStudent.get(r.studentId)
    paidByStudent.set(r.studentId, prev === undefined ? !!r.paid : prev && !!r.paid)
  }
  let paid = 0
  for (const allPaid of paidByStudent.values()) if (allPaid) paid++
  const total = paidByStudent.size
  return { total, paid, debt: total - paid }
}
