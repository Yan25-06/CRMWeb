import { supabase } from '@/lib/supabase'

export const feeService = {
  // Một dòng cho mỗi enrollment chưa dropped. Học phí lấy từ LỚP; trạng thái
  // đóng phí là cờ nhị phân fees.paid theo (student, class, year, month).
  async buildFeesRows(year, month) {
    const { data: enrollments, error: enrErr } = await supabase
      .from('enrollments')
      .select('student_id, class_id, students(id, name), classes(id, name, monthly_fee)')
      .neq('status', 'dropped')
    if (enrErr) throw new Error(enrErr.message)
    if (!enrollments || enrollments.length === 0) return []

    const studentIds = [...new Set(enrollments.map(e => e.student_id))]

    const { data: feeRecords, error: feeErr } = await supabase
      .from('fees')
      .select('student_id, class_id, paid')
      .in('student_id', studentIds)
      .eq('year', year)
      .eq('month', month)
    if (feeErr) throw new Error(feeErr.message)

    const key = (studentId, classId) => `${studentId}:${classId}`
    const paidByKey = new Map()
    for (const f of feeRecords ?? []) {
      if (!f.class_id) continue
      paidByKey.set(key(f.student_id, f.class_id), !!f.paid)
    }

    return enrollments.map(e => ({
      studentId: e.student_id,
      classId: e.class_id,
      name: e.students?.name ?? '—',
      className: e.classes?.name ?? '—',
      monthlyFee: e.classes?.monthly_fee ?? 0,
      paid: paidByKey.get(key(e.student_id, e.class_id)) ?? false,
    }))
  },

  async setPaid(studentId, classId, year, month, paid) {
    const { error } = await supabase
      .from('fees')
      .upsert(
        { student_id: studentId, class_id: classId, year, month, paid },
        { onConflict: 'student_id,class_id,year,month' },
      )
    if (error) throw new Error(error.message)
  },
}
