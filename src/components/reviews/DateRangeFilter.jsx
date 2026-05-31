import { CalendarRange } from 'lucide-react'

/**
 * DateRangeFilter — two date inputs (fromDate, toDate) with inline validation.
 * Props: value = { fromDate, toDate }, onChange({ fromDate, toDate })
 * onChange is NOT called when fromDate > toDate.
 */
export const DateRangeFilter = ({ value, onChange }) => {
  const { fromDate, toDate } = value
  const invalid = fromDate && toDate && fromDate > toDate

  const handleFrom = (e) => {
    const next = { fromDate: e.target.value, toDate }
    if (next.fromDate && next.toDate && next.fromDate > next.toDate) return
    onChange(next)
  }

  const handleTo = (e) => {
    const next = { fromDate, toDate: e.target.value }
    if (next.fromDate && next.toDate && next.fromDate > next.toDate) return
    onChange(next)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CalendarRange size={15} className="text-navy-400 shrink-0" />
      <span className="text-xs text-navy-500 font-medium shrink-0">Từ</span>
      <input
        type="date"
        value={fromDate}
        onChange={handleFrom}
        className="text-xs border border-navy-200 rounded-lg px-2 py-1.5 text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
      />
      <span className="text-xs text-navy-400 shrink-0">—</span>
      <input
        type="date"
        value={toDate}
        onChange={handleTo}
        className="text-xs border border-navy-200 rounded-lg px-2 py-1.5 text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
      />
      {invalid && (
        <span className="text-xs text-red-500 font-medium">
          Ngày bắt đầu không được sau ngày kết thúc
        </span>
      )}
    </div>
  )
}
