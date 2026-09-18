import { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { StatCard, Empty, Skeleton, Select, toast } from '@/components/ui'
import { Users, AlertCircle } from 'lucide-react'
import { FeesTable } from '@/components/fees/FeesTable'
import { feeService } from '@/services/feeService'
import { filterFeeRows, countFeeStudents } from '@/utils/fees'
import { ExportExcelButton } from '@/components/reports/ExportExcelButton'

const PAYMENT_TABS = [
  { id: 'all',  label: 'Tất cả' },
  { id: 'debt', label: 'Chưa đóng' },
  { id: 'paid', label: 'Đã đóng' },
]

const FEE_EXPORT_COLUMNS = [
  { key: 'name',      label: 'Học sinh' },
  { key: 'className', label: 'Lớp' },
  { key: 'period',    label: 'Tháng' },
  { key: 'status',    label: 'Trạng thái' },
]

export const FeesPage = ({ year, month }) => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [payStatusFilter, setPayStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await feeService.buildFeesRows(year, month)
      setRows(data)
    } catch {
      toast.error('Không tải được dữ liệu học phí')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [year, month])

  useEffect(() => { refresh() }, [refresh])

  // Optimistic: đổi cờ tại chỗ, revert nếu ghi lỗi.
  const handleTogglePaid = async (row, nextPaid) => {
    const apply = (value) => setRows(prev => prev.map(r =>
      r.studentId === row.studentId && r.classId === row.classId
        ? { ...r, paid: value }
        : r
    ))
    apply(nextPaid)
    try {
      await feeService.setPaid(row.studentId, row.classId, year, month, nextPaid)
      toast.success(nextPaid ? 'Đã đánh dấu đã đóng' : 'Đã bỏ đánh dấu')
    } catch {
      apply(!nextPaid)
      toast.error('Lưu không thành công, vui lòng thử lại.')
    }
  }

  const uniqueClassNames = [...new Set(rows.map(r => r.className).filter(Boolean))].sort()

  const classFilteredRows = filterFeeRows(rows, { className: classFilter, status: 'all' })
  const { total, paid: paidCount, debt: debtCount } = countFeeStudents(classFilteredRows)

  const tabCounts = {
    all:  classFilteredRows.length,
    debt: filterFeeRows(classFilteredRows, { status: 'debt' }).length,
    paid: filterFeeRows(classFilteredRows, { status: 'paid' }).length,
  }

  const filteredRows = filterFeeRows(classFilteredRows, { status: payStatusFilter })

  const exportRows = filteredRows.map(r => ({
    ...r,
    period: `${month}/${year}`,
    status: r.paid ? 'Đã đóng' : 'Chưa đóng',
  }))

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Học phí</h1>
          <p className="text-sm text-navy-500 mt-0.5">Tháng {month}/{year}</p>
        </div>
        <ExportExcelButton
          rows={exportRows}
          columns={FEE_EXPORT_COLUMNS}
          filename={`hoc-phi-thang-${month}-${year}`}
          disabled={loading || filteredRows.length === 0}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          [1, 2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Đã đóng đủ"
              value={`${paidCount}/${total}`}
              sub="học viên"
              icon={<Users size={16} />}
              accent="success"
            />
            <StatCard
              label="Chưa đóng"
              value={String(debtCount)}
              sub={debtCount > 0 ? 'học viên' : 'Tất cả đã đóng'}
              icon={<AlertCircle size={16} />}
              accent={debtCount > 0 ? 'danger' : 'success'}
            />
          </>
        )}
      </div>

      {/* Filters: class + payment status */}
      {!loading && rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {uniqueClassNames.length > 0 && (
            <>
              <label className="flex items-center gap-2">
                <span className="text-sm font-medium text-navy-700">Lớp:</span>
                <Select
                  value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                  className="text-sm w-auto"
                >
                  <option value="all">Tất cả lớp</option>
                  {uniqueClassNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
              </label>
              <span className="hidden sm:block w-px h-6 bg-navy-200 shrink-0" aria-hidden="true" />
            </>
          )}
          <div className="flex gap-1 flex-wrap">
            {PAYMENT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setPayStatusFilter(tab.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-sm font-medium transition-all pressable',
                  payStatusFilter === tab.id
                    ? 'bg-navy-800 text-white'
                    : 'bg-white text-navy-500 border border-navy-100 hover:text-navy-800 hover:border-navy-300'
                )}
              >
                {tab.label}
                <span className={clsx(
                  'ml-1.5 text-xs font-normal',
                  payStatusFilter === tab.id ? 'text-navy-200' : 'text-navy-500'
                )}>
                  ({tabCounts[tab.id]})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table or empty state */}
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 rounded-xl" />
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <Empty
          icon="💰"
          title="Chưa có học viên nào trong tháng này"
          desc="Thêm học viên vào lớp để bắt đầu theo dõi học phí"
        />
      ) : filteredRows.length === 0 ? (
        <Empty
          icon="🔍"
          title={`Không có học sinh nào trong nhóm "${PAYMENT_TABS.find(t => t.id === payStatusFilter)?.label}"`}
          desc="Thử chọn bộ lọc khác"
        />
      ) : (
        <FeesTable rows={filteredRows} onTogglePaid={handleTogglePaid} />
      )}
    </div>
  )
}
