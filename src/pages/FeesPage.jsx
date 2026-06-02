import { useState, useEffect, useCallback } from 'react'
import { StatCard, Button, Empty } from '@/components/ui'
import { toast } from '@/components/ui'
import { Banknote, Users, AlertCircle, Plus } from 'lucide-react'
import { PaymentModal } from '@/components/fees/PaymentModal'
import { FeesTable } from '@/components/fees/FeesTable'
import { getStudents } from '@/services/studentService'
import { getClasses } from '@/services/classService'
import { getEnrollments } from '@/services/enrollmentService'
import { calcFee } from '@/services/feeService'
import { getPaidAmountByStudentPeriod, createPayment } from '@/services/paymentService'
import { fmtVND, monthISO } from '@/utils/helpers'

const buildRows = async (period) => {
  const [students, classes, enrollments] = await Promise.all([
    getStudents(),
    getClasses(),
    getEnrollments(),
  ])
  const activeEnrollments = enrollments.filter(e => e.status !== 'dropped')
  const [year, month] = period.split('-').map(Number)

  const rowData = await Promise.all(
    students
      .filter(s => activeEnrollments.some(e => e.studentId === s.id))
      .map(async s => {
        const enrollment = activeEnrollments.find(e => e.studentId === s.id)
        const cls = classes.find(c => c.id === enrollment?.classId)
        const [expected, paid] = await Promise.all([
          calcFee(s.id, year, month),
          getPaidAmountByStudentPeriod(s.id, period),
        ])
        return { studentId: s.id, name: s.name, className: cls?.name ?? '—', expected, paid }
      })
  )
  return rowData
}

export const FeesPage = ({ year, month }) => {
  const currentPeriod = `${year}-${String(month).padStart(2, '0')}`
  const [rows, setRows] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultStudentId, setDefaultStudentId] = useState(null)

  const refresh = useCallback(async () => {
    const data = await buildRows(currentPeriod)
    setRows(data)
  }, [currentPeriod])

  useEffect(() => { refresh() }, [refresh])

  const handleSave = async (data) => {
    try {
      await createPayment({ ...data, period: data.period })
      toast.success('Đã ghi nhận thanh toán!')
      await refresh()
    } catch {
      toast.error('Lưu không thành công, vui lòng thử lại.')
    }
  }

  const openAdd = (studentId = null) => {
    setDefaultStudentId(studentId)
    setModalOpen(true)
  }

  const totalExpected = rows.reduce((s, r) => s + r.expected, 0)
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0)
  const paidCount = rows.filter(r => r.paid >= r.expected && r.expected > 0).length
  const debtCount = rows.filter(r => r.paid < r.expected).length
  const totalDebt = rows.reduce((s, r) => s + Math.max(0, r.expected - r.paid), 0)

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Học Phí</h1>
          <p className="text-sm text-navy-400 mt-0.5">Tháng {month}/{year}</p>
        </div>
        <Button onClick={() => openAdd()} className="shrink-0">
          <Plus size={15} className="mr-1.5" /> Ghi nhận thanh toán
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng thu tháng này" value={fmtVND(totalPaid)} icon={<Banknote size={16} />} accent="success" />
        <StatCard label="Kỳ vọng" value={fmtVND(totalExpected)} icon={<Banknote size={16} />} accent="navy" />
        <StatCard label="Đã đóng đủ" value={`${paidCount}/${rows.length}`} sub="học viên" icon={<Users size={16} />} accent="navy" />
        <StatCard label="Còn nợ" value={fmtVND(totalDebt)} sub={debtCount > 0 ? `${debtCount} học viên` : 'Không có nợ'} icon={<AlertCircle size={16} />} accent={debtCount > 0 ? 'danger' : 'success'} />
      </div>

      {rows.length === 0 ? (
        <Empty
          icon="💰"
          title="Chưa có học viên nào trong tháng này"
          desc="Thêm học viên vào lớp để bắt đầu theo dõi học phí"
          action={<Button onClick={() => openAdd()}><Plus size={15} className="mr-1.5" />Ghi nhận thanh toán đầu tiên</Button>}
        />
      ) : (
        <FeesTable rows={rows} period={currentPeriod} onAddPayment={openAdd} onRefresh={refresh} />
      )}

      <PaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        defaultStudentId={defaultStudentId}
        defaultPeriod={currentPeriod}
      />
    </div>
  )
}
