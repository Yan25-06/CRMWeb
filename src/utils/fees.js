// Logic thuần cho trang Học phí — KHÔNG import React/supabase để test bằng Node.
// FeeRow = { studentId, classId, name, className, monthlyFee, paid }

// Dòng lớp không có học phí cấu hình (monthlyFee null/0 — vd chưa có lịch sử phí
// trước migration 20260918000001) không thể "chưa đóng": ô học phí hiển thị "—"
// (FeesTable), không phải "0đ". Model cũ gọi trạng thái này là 'free'.
const hasFee = (r) => (r.monthlyFee ?? 0) > 0

export function filterFeeRows(rows, { className = 'all', status = 'all' } = {}) {
  return (rows ?? []).filter(r => {
    if (className !== 'all' && r.className !== className) return false
    if (status === 'paid' && (!r.paid || !hasFee(r))) return false
    if (status === 'debt' && (r.paid || !hasFee(r))) return false
    return true
  })
}

// Đếm theo HỌC SINH DUY NHẤT, không theo dòng lớp: một học sinh học nhiều lớp
// chỉ tính "đã đóng đủ" khi mọi lớp CÓ HỌC PHÍ đều đã tick. Dòng lớp không có
// học phí (monthlyFee <= 0, trạng thái 'free') không góp vào paid lẫn debt —
// một học sinh chỉ toàn lớp 'free' không tính vào total.
export function countFeeStudents(rows) {
  const paidByStudent = new Map()
  for (const r of rows ?? []) {
    if (!hasFee(r)) continue
    const prev = paidByStudent.get(r.studentId)
    paidByStudent.set(r.studentId, prev === undefined ? !!r.paid : prev && !!r.paid)
  }
  let paid = 0
  for (const allPaid of paidByStudent.values()) if (allPaid) paid++
  const total = paidByStudent.size
  return { total, paid, debt: total - paid }
}
