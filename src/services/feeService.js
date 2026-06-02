import { supabase } from '@/lib/supabase'
import { paymentService } from './paymentService'

const fromDB = (row) => row ? {
  id: row.id,
  studentId: row.student_id,
  year: row.year,
  month: row.month,
  surcharge: row.surcharge ?? 0,
  paid: row.paid ?? false,
  note: row.note,
} : null

export const feeService = {
  async getByStudentMonth(studentId, year, month) {
    const { data, error } = await supabase
      .from('fees')
      .select('*')
      .eq('student_id', studentId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },

  async upsert(data) {
    const payload = {
      student_id: data.studentId,
      year: data.year,
      month: data.month,
    }
    if (data.surcharge !== undefined) payload.surcharge = data.surcharge
    if (data.paid !== undefined) payload.paid = data.paid
    if (data.note !== undefined) payload.note = data.note

    const { data: row, error } = await supabase
      .from('fees')
      .upsert(payload, { onConflict: 'student_id,year,month' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  // expected = monthly_fee + surcharge  |  course_fee (no session counting)
  async calcFee(studentId, year, month) {
    const [feeRec, enrRes] = await Promise.all([
      this.getByStudentMonth(studentId, year, month),
      supabase
        .from('enrollments')
        .select('fee_type, monthly_fee, course_fee')
        .eq('student_id', studentId)
        .neq('status', 'dropped')
        .limit(1)
        .maybeSingle(),
    ])
    if (enrRes.error) throw new Error(enrRes.error.message)

    const enr = enrRes.data
    if (!enr) return 0

    if (enr.fee_type === 'course') return enr.course_fee ?? 0
    return (enr.monthly_fee ?? 0) + (feeRec?.surcharge ?? 0)
  },

  async isFeePaid(studentId, year, month) {
    const period = `${year}-${String(month).padStart(2, '0')}`
    const [totalFee, totalPaid] = await Promise.all([
      this.calcFee(studentId, year, month),
      paymentService.getPaidAmount(studentId, period),
    ])
    return totalFee > 0 && totalPaid >= totalFee
  },

  // Bulk load for FeesPage — 3 queries only (no sessions/attendance needed)
  async buildFeesRows(year, month) {
    const period = `${year}-${String(month).padStart(2, '0')}`

    // 1. Active enrollments with student + class names
    const { data: enrollments, error: enrErr } = await supabase
      .from('enrollments')
      .select('student_id, class_id, fee_type, monthly_fee, course_fee, students(id, name), classes(id, name)')
      .neq('status', 'dropped')
    if (enrErr) throw new Error(enrErr.message)
    if (!enrollments || enrollments.length === 0) return []

    const studentIds = [...new Set(enrollments.map(e => e.student_id))]

    // 2. Parallel: fee records for surcharge, payments for period
    const [feeRes, payRes] = await Promise.all([
      supabase
        .from('fees')
        .select('student_id, surcharge')
        .in('student_id', studentIds)
        .eq('year', year)
        .eq('month', month),
      supabase
        .from('payments')
        .select('student_id, amount')
        .in('student_id', studentIds)
        .eq('period', period),
    ])
    if (feeRes.error) throw new Error(feeRes.error.message)
    if (payRes.error) throw new Error(payRes.error.message)

    const surchargeByStudent = {}
    for (const f of feeRes.data ?? []) {
      surchargeByStudent[f.student_id] = f.surcharge ?? 0
    }

    const paidByStudent = {}
    for (const p of payRes.data ?? []) {
      paidByStudent[p.student_id] = (paidByStudent[p.student_id] ?? 0) + (p.amount ?? 0)
    }

    // Group by student (a student may appear in multiple classes; take first active)
    const byStudent = {}
    for (const e of enrollments) {
      if (byStudent[e.student_id]) continue
      byStudent[e.student_id] = {
        studentId: e.student_id,
        name: e.students?.name ?? '—',
        className: e.classes?.name ?? '—',
        feeType: e.fee_type ?? 'monthly',
        monthlyFee: e.monthly_fee ?? 0,
        courseFee: e.course_fee ?? 0,
      }
    }

    return Object.values(byStudent).map(s => {
      const surcharge = surchargeByStudent[s.studentId] ?? 0
      const expected = s.feeType === 'course'
        ? s.courseFee
        : s.monthlyFee + surcharge

      return {
        studentId: s.studentId,
        name: s.name,
        className: s.className,
        feeType: s.feeType,
        expected,
        paid: paidByStudent[s.studentId] ?? 0,
      }
    })
  },
}
