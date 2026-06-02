import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { FileSpreadsheet, Users } from 'lucide-react'
import { reviewService } from '@/services/reviewService'
import { enrollmentService } from '@/services/enrollmentService'
import { studentService } from '@/services/studentService'
import { attendanceService } from '@/services/attendanceService'
import { homeworkService } from '@/services/homeworkService'

// Default present: only absent records exist; use sessionCount as denominator
const calcAttendancePct = (studentId, { sessionCount, records }) => {
  if (sessionCount === 0) return null
  const absent = records.filter(r => r.studentId === studentId && r.present === false).length
  return Math.round(((sessionCount - absent) / sessionCount) * 1000) / 10
}

const calcHomeworkPct = (studentId, hwRecords) => {
  const recs = hwRecords.filter(r => r.studentId === studentId)
  if (recs.length === 0) return null
  let done = 0, inProg = 0
  recs.forEach(r => {
    if (r.progress === 'done') done++
    else if (r.progress === 'in_progress') inProg++
  })
  return Math.round((done * 100 + inProg * 50) / recs.length)
}

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

/**
 * ClassOverviewTable — summary table of all students in a class.
 * Props: classId, cls (object), dateRange = { fromDate, toDate }
 */
export const ClassOverviewTable = ({ classId, cls, dateRange }) => {
  const [allReviews,     setAllReviews]     = useState([])
  const [activeStudents, setActiveStudents] = useState([])
  const [attData,        setAttData]        = useState({ sessionCount: 0, records: [] })
  const [hwRecords,      setHwRecords]      = useState([])

  // Load students once per class
  useEffect(() => {
    if (!classId) { setActiveStudents([]); return }
    enrollmentService.getByClass(classId).then(async (enrollments) => {
      const activeIds = enrollments.filter(e => e.status === 'active').map(e => e.studentId)
      const all = await studentService.getAll()
      setActiveStudents(all.filter(s => activeIds.includes(s.id)))
    }).catch(() => {})
  }, [classId])

  // Reload reviews + attendance + homework when classId or dateRange changes
  useEffect(() => {
    if (!classId) {
      setAllReviews([])
      setAttData({ sessionCount: 0, records: [] })
      setHwRecords([])
      return
    }
    Promise.all([
      reviewService.getByClass(classId),
      attendanceService.getByClassRange(classId, dateRange.fromDate, dateRange.toDate),
      homeworkService.getByClassRange(classId, dateRange.fromDate, dateRange.toDate),
    ]).then(([reviews, att, hw]) => {
      setAllReviews(reviews)
      setAttData(att)
      setHwRecords(hw)
    }).catch(() => {})
  }, [classId, dateRange.fromDate, dateRange.toDate])

  const rows = useMemo(() => {
    if (!classId) return []
    return activeStudents.map(s => {
      const studentReviews = allReviews
        .filter(r => r.studentId === s.id && r.date >= dateRange.fromDate && r.date <= dateRange.toDate)
      const latestReview = studentReviews[0] ?? null
      const attPct       = calcAttendancePct(s.id, attData)
      const hwPct        = calcHomeworkPct(s.id, hwRecords)
      const tags         = Array.isArray(latestReview?.tags) ? latestReview.tags : []
      const lastRemark   = latestReview?.remark || tags[0] || '—'
      return { student: s, attPct, hwPct, lastRemark }
    })
  }, [classId, activeStudents, allReviews, attData, hwRecords, dateRange.fromDate, dateRange.toDate])

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

    const titleRow  = [`Tổng quan lớp: ${cls?.name ?? ''}`]
    const rangeRow  = [`Khoảng thời gian: ${fromVN} - ${toVN}`]
    const emptyRow  = []

    const ws = XLSX.utils.aoa_to_sheet([titleRow, rangeRow, emptyRow, header, ...data])
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
      {/* Header + export button */}
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
          <FileSpreadsheet size={14} />
          Xuất Excel
        </button>
      </div>

      {/* Table */}
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
