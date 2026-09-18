import { useState } from 'react'
import { clsx } from 'clsx'
import { Badge } from '@/components/ui'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { fmtVND } from '@/utils/helpers'

export const FeesTable = ({ rows, onTogglePaid }) => {
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = [...rows].sort((a, b) =>
    sortAsc ? a.name.localeCompare(b.name, 'vi') : b.name.localeCompare(a.name, 'vi')
  )

  return (
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
              <th className="px-5 py-3 font-semibold text-navy-700 text-right">Học phí</th>
              <th className="px-5 py-3 font-semibold text-navy-700 text-center">Trạng thái</th>
              <th className="px-5 py-3 font-semibold text-navy-700 text-center w-32">Đã đóng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50">
            {sorted.map(row => (
              <tr
                key={`${row.studentId}-${row.classId}`}
                className="hover:bg-navy-50/40 transition-colors"
              >
                <td className="px-5 py-3 font-medium text-navy-900">{row.name}</td>
                <td className="px-5 py-3 text-navy-500">{row.className}</td>
                <td className="px-5 py-3 text-right text-navy-700">
                  {row.monthlyFee > 0 ? fmtVND(row.monthlyFee) : '—'}
                </td>
                <td className="px-5 py-3 text-center">
                  <Badge variant={row.paid ? 'success' : 'danger'}>
                    {row.paid ? 'Đã đóng' : 'Chưa đóng'}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-center">
                  <label
                    className="inline-flex items-center justify-center cursor-pointer"
                    title={row.paid ? 'Bỏ đánh dấu đã đóng' : 'Đánh dấu đã đóng'}
                  >
                    <input
                      type="checkbox"
                      checked={row.paid}
                      onChange={e => onTogglePaid(row, e.target.checked)}
                      className={clsx(
                        'w-5 h-5 rounded-md cursor-pointer',
                        'accent-navy-800 border-navy-200'
                      )}
                      aria-label={`Học phí của ${row.name} tại lớp ${row.className}`}
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-2 border-t border-navy-50 text-xs text-navy-500">
        {sorted.length} dòng · Tick vào ô để đánh dấu đã đóng
      </div>
    </div>
  )
}
