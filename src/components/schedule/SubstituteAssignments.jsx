import { clsx } from 'clsx'
import { Repeat, Check } from 'lucide-react'
import { fmtTime, fmtDate } from '@/utils/helpers'

// Danh sách buổi GV hiện tại được giao dạy thay. Card vàng + nút xác nhận.
export const SubstituteAssignments = ({ assignments = [], onConfirm }) => {
  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Repeat size={15} className="text-amber-600" />
        <h3 className="text-sm font-semibold text-navy-800">Buổi được giao dạy thay</h3>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          {assignments.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {assignments.map(a => (
          <div
            key={a.id}
            className={clsx(
              'rounded-xl border p-3 flex items-center justify-between gap-3',
              a.substituteConfirmed
                ? 'border-green-200 border-l-4 border-l-green-500 bg-green-50'
                : 'border-amber-200 border-l-4 border-l-amber-500 bg-amber-50'
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={clsx(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  a.substituteConfirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                )}>
                  {a.substituteConfirmed ? 'ĐÃ DẠY THAY ✓' : 'DẠY THAY'}
                </span>
                <span className="text-sm font-semibold text-navy-900 truncate">{a.className}</span>
              </div>
              <p className="text-xs text-navy-500 mt-1">
                {fmtDate(a.date)} · {fmtTime(a.startTime)}–{fmtTime(a.endTime)}
                {a.room ? ` · ${a.room}` : ''} · Thay cho {a.mainTeacherName}
              </p>
            </div>
            {a.substituteConfirmed ? (
              <span className="text-xs text-green-600 font-medium shrink-0">Đã tính lương</span>
            ) : (
              <button
                onClick={() => onConfirm?.(a)}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Check size={13} /> Xác nhận đã dạy
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
