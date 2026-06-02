import { useState, useEffect, useCallback } from 'react'
import { StatCard, Button, Empty } from '@/components/ui'
import { toast } from '@/components/ui'
import { Banknote, Users, AlertCircle, Plus } from 'lucide-react'
import { PaymentModal } from '@/components/fees/PaymentModal'
import { FeesTable } from '@/components/fees/FeesTable'
import { feeService } from '@/services/feeService'
import { paymentService } from '@/services/paymentService'
import { fmtVND } from '@/utils/helpers'

export const FeesPage = ({ year, month }) => {
  const currentPeriod = `${year}-${String(month).padStart(2, '0')}`
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultStudentId, setDefaultStudentId] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await feeService.buildFeesRows(year, month)
      setRows(data)
    } catch (e) {
      toast.error('Không tải được dữ liệu học phí')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { refresh() }, [refresh])

  const handleSave = async (data) => {
    try {
      await paymentService.create({ ...data, period: data.period })
      toast.success('Đã ghi nhận thanh toán!')
      refresh()
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
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Học Phí</h1>
          <p className="text-sm text-navy-400 mt-0.5">
            Tháng {month}/{year}
          </p>
        </div>
        <Button onClick={() => openAdd()} className="shrink-0">
          <Plus size={15} className="mr-1.5" />
          Ghi nhận thanh toán
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng thu tháng này"
          value={fmtVND(totalPaid)}
          icon={<Banknote size={16} />}
          accent="success"
        />
        <StatCard
          label="Kỳ vọng"
          value={fmtVND(totalExpected)}
          icon={<Banknote size={16} />}
          accent="navy"
        />
        <StatCard
          label="Đã đóng đủ"
          value={`${paidCount}/${rows.length}`}
          sub="học viên"
          icon={<Users size={16} />}
          accent="navy"
        />
        <StatCard
          label="Còn nợ"
          value={fmtVND(totalDebt)}
          sub={debtCount > 0 ? `${debtCount} học viên` : 'Không có nợ'}
          icon={<AlertCircle size={16} />}
          accent={debtCount > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Table or empty state */}
      {loading ? (
        <div className="flex justify-center py-16 text-navy-400 text-sm">Đang tải...</div>
      ) : rows.length === 0 ? (
        <Empty
          icon="💰"
          title="Chưa có học viên nào trong tháng này"
          desc="Thêm học viên vào lớp để bắt đầu theo dõi học phí"
          action={
            <Button onClick={() => openAdd()}>
              <Plus size={15} className="mr-1.5" />
              Ghi nhận thanh toán đầu tiên
            </Button>
          }
        />
      ) : (
        <FeesTable
          rows={rows}
          period={currentPeriod}
          onAddPayment={openAdd}
          onRefresh={refresh}
        />
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
