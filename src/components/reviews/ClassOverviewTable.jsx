import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { FileSpreadsheet, Users } from 'lucide-react'
import { Button } from '@/components/ui'
import { getActiveStudents } from '@/services/enrollmentService'
import { getReviewsByStudent } from '@/services/reviewService'
import { getAttendanceByRange } from '@/services/attendanceService'
import { getHomeworkByRange } from '@/services/homeworkService'

const PctBadge = ({ pct }) => {
  if (pct == null) return <span className="text-xs text-navy-300">—</span>
  const cls = pct >= 80 ? 'bg-emerald-100 text-emerald-700'
            : pct >= 60 ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{pct}%</span>
}

const fmtDateVN = (d) => {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export const ClassOverviewTable = ({ classId, cls, dateRange }) => {
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!classId) { setRows([]); return }
    let cancelled = false

    const load = async () => {
      const students = await getActiveStudents(classId)
      const rowData = await Promise.all(students.map(async s => {
        const [reviews, attRecs, hwRecs] = await Promise.all([
          getReviewsByStudent(s.id, classId),
          getAttendanceByRange(s.id, classId, dateRange.fromDate, dateRange.toDate),
          getHomeworkByRange(s.id, classId, dateRange.fromDate, dateRange.toDate),
        ])
        const filteredReviews = reviews.filter(r => r.date >= dateRange.fromDate && r.date <= dateRange.toDate)
        const latestReview = filteredReviews[0] ?? null

        const attPct = attRecs.length > 0
          ? Math.round((attRecs.filter(r => r.present).length / attRecs.length) * 1000) / 10
          : null

        const total = hwRecs.length
        const doneCount = hwRecs.filter(r => r.progress === 'done' || r.progress === 100).length
        const inProgCount = hwRecs.filter(r => r.progress === 'in_progress' || r.progress === 50).length
        const hwPct = total > 0 ? Math.round((doneCount * 100 + inProgCount * 50) / total) : null

        const lastRemark = latestReview?.remark || latestReview?.tags?.[0] || '—'
        return { student: s, attPct, hwPct, lastRemark }
      }))
      if (!cancelled) setRows(rowData)
    }

    load()
    return () => { cancelled = true }
  }, [classId, dateRange.fromDate, dateRange.toDate])

  const handleExportExcel = () => {
    if (!rows.length) return
    const fromVN = fmtDateVN(dateRange.fromDate)
    const toVN   = fmtDateVN(dateRange.toDate)
    const header = ['Họ tên', '% Chuyên cần', '% Bài tập', 'Nhận xét gần nhất']
    const data = rows.map(({ student, attPct, hwPct, lastRemark }) => [
      student.name,
      attPct != null ? `${attPct}%` : '—',
      hwPct  != null ? `${hwPct}%`  : '—',
      lastRemark,
    ])
    const ws = XLSX.utils.aoa_to_sheet([
      [`Tổng quan lớp: ${cls?.name ?? ''}`],
      [`Khoảng thời gian: ${fromVN} – ${toVN}`],
      [],
      header,
      ...data,
    ])
    ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 40 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tổng Quan Lớp')
    const className = cls?.name?.replace(/\s+/g, '-') ?? 'lop'
    XLSX.writeFile(wb, `tong-quan-${className}-${dateRange.fromDate}-${dateRange.toDate}.xlsx`)
  }

  if (!classId) {
    return (
      <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-16 flex flex-col items-center justify-center gap-3 text-center">
        <Users size={28} className="text-navy-200" strokeWidth={1.5} />
        <p className="text-navy-400">Chọn lớp để xem tổng quan</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-16 flex flex-col items-center justify-center gap-3 text-center">
        <Users size={28} className="text-navy-200" strokeWidth={1.5} />
        <p className="text-navy-400">Lớp này chưa có học viên</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-navy-800">{cls?.name} · {rows.length} học viên</p>
          <p className="text-xs text-navy-400">Tổng hợp theo khoảng ngày đã lọc</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={rows.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet size={14} /> Xuất Excel
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="text-left px-4 py-3 font-semibold text-navy-600 text-xs uppercase tracking-wide">Họ tên</th>
                <th className="text-center px-3 py-3 font-semibold text-navy-600 text-xs uppercase tracking-wide">Chuyên cần</th>
                <th className="text-center px-3 py-3 font-semibold text-navy-600 text-xs uppercase tracking-wide">Bài tập</th>
                <th className="text-left px-4 py-3 font-semibold text-navy-600 text-xs uppercase tracking-wide">Nhận xét gần nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {rows.map(({ student, attPct, hwPct, lastRemark }) => (
                <tr key={student.id} className="hover:bg-navy-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-navy-800">{student.name}</td>
                  <td className="px-3 py-3 text-center"><PctBadge pct={attPct} /></td>
                  <td className="px-3 py-3 text-center"><PctBadge pct={hwPct} /></td>
                  <td className="px-4 py-3 text-navy-500 text-xs max-w-[200px] truncate">{lastRemark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
