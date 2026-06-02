import { useState } from 'react'
import { clsx } from 'clsx'
import { Badge } from '@/components/ui'
import { ChevronUp, ChevronDown, History, Plus } from 'lucide-react'
import { fmtVND } from '@/utils/helpers'
import { getPaymentsByStudent } from '@/services/paymentService'
import { StudentPaymentHistoryPanel } from './StudentPaymentHistoryPanel'

const statusInfo = (paid, expected) => {
  if (paid <= 0) return { label: 'Còn nợ', variant: 'danger' }
  if (paid >= expected) return { label: 'Đã đóng', variant: 'success' }
  return { label: 'Đóng một phần', variant: 'warning' }
}

export const FeesTable = ({ rows, period, onAddPayment, onRefresh }) => {
  const [sortAsc, setSortAsc] = useState(true)
  const [historyFor, setHistoryFor] = useState(null)
  const [historyPayments, setHistoryPayments] = useState([])

  const sorted = [...rows].sort((a, b) =>
    sortAsc ? a.name.localeCompare(b.name, 'vi') : b.name.localeCompare(a.name, 'vi')
  )

  const openHistory = async (row) => {
    setHistoryPayments(await getPaymentsByStudent(row.studentId))
    setHistoryFor(row)
  }

  const closeHistory = () => {
    setHistoryFor(null)
    onRefresh?.()
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="bg-navy-50/60 border-b border-navy-100">
                <th
                  className="px-5 py-3 font-semibold text-navy-700 cursor-pointer select-none"
                  onClick={() => setSortAsc(a => !a)}
                >
                  <span className="flex items-center gap-1">
                    Học viên
                    {sortAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </span>
                </th>
                <th className="px-5 py-3 font-semibold text-navy-700">Lớp</th>
                <th className="px-5 py-3 font-semibold text-navy-700 text-right">Học phí kỳ vọng</th>
                <th className="px-5 py-3 font-semibold text-navy-700 text-right">Đã đóng</th>
                <th className="px-5 py-3 font-semibold text-navy-700 text-center">Trạng thái</th>
                <th className="px-5 py-3 font-semibold text-navy-700 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {sorted.map(row => {
                const { label, variant } = statusInfo(row.paid, row.expected)
                return (
                  <tr key={row.studentId} className="hover:bg-navy-50/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-navy-900">{row.name}</td>
                    <td className="px-5 py-3 text-navy-500">{row.className}</td>
                    <td className="px-5 py-3 text-right text-navy-700">{fmtVND(row.expected)}</td>
                    <td className={clsx(
                      'px-5 py-3 text-right font-semibold',
                      row.paid > 0 ? 'text-emerald-700' : 'text-navy-400'
                    )}>
                      {fmtVND(row.paid)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={variant}>{label}</Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="Xem lịch sử"
                          onClick={() => openHistory(row)}
                          className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                        >
                          <History size={15} />
                        </button>
                        <button
                          title="Ghi nhận thêm"
                          onClick={() => onAddPayment(row.studentId)}
                          className="p-1.5 rounded-lg text-navy-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <StudentPaymentHistoryPanel
        open={!!historyFor}
        onClose={closeHistory}
        student={historyFor}
        payments={historyPayments}
        onDeleted={async () => {
          setHistoryPayments(await getPaymentsByStudent(historyFor?.studentId))
          onRefresh?.()
        }}
      />
    </>
  )
}
