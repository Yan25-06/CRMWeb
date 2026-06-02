import { useState, useMemo, useEffect } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { ReportCard } from '@/components/reports/ReportCard'
import { getClasses } from '@/services/classService'
import { getStudents } from '@/services/studentService'
import { getEnrollments, getEnrollmentsByClass } from '@/services/enrollmentService'
import { getSessionsByClass } from '@/services/sessionService'
import { getAttendanceByClass } from '@/services/attendanceService'
import { getMockTestsByClass, getMockTestResultsByClass } from '@/services/mockTestService'
import { getAllPayments } from '@/services/paymentService'
import { calcFee } from '@/services/feeService'
import { fmtVND, fmtDate } from '@/utils/helpers'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { callbacks: {} } },
  scales: { y: { beginAtZero: true } },
}

const monthsBetween = (from, to) => {
  const result = []
  const cur = new Date(from + '-01')
  const end = new Date(to + '-01')
  while (cur <= end) {
    result.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
    cur.setMonth(cur.getMonth() + 1)
  }
  return result
}

const currentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const sixMonthsAgo = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 5)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Attendance card ──────────────────────────────────────
const AttendanceCard = ({ classes }) => {
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [fromMonth, setFromMonth] = useState(sixMonthsAgo())
  const [toMonth, setToMonth] = useState(currentMonth())
  const [sessions, setSessions] = useState([])
  const [attendance, setAttendance] = useState([])
  const [enrolledStudentIds, setEnrolledStudentIds] = useState([])

  useEffect(() => { setClassId(classes[0]?.id ?? '') }, [classes])

  useEffect(() => {
    if (!classId) return
    Promise.all([
      getSessionsByClass(classId),
      getAttendanceByClass(classId),
      getEnrollmentsByClass(classId),
    ]).then(([sess, att, enrollments]) => {
      setSessions(sess)
      setAttendance(att)
      setEnrolledStudentIds(enrollments.filter(e => e.status !== 'dropped').map(e => e.studentId))
    })
  }, [classId])

  const { chartData, tableRows, hasData } = useMemo(() => {
    if (!classId) return { chartData: null, tableRows: [], hasData: false }
    const months = monthsBetween(fromMonth, toMonth)
    const labels = months.map(m => { const [y, mo] = m.split('-'); return `${mo}/${y}` })

    const dataByMonth = months.map(m => {
      const monthSessions = sessions.filter(s => s.date.startsWith(m))
      if (!monthSessions.length) return null
      const sessionIds = new Set(monthSessions.map(s => s.id))
      let present = 0, total = 0
      enrolledStudentIds.forEach(studentId => {
        monthSessions.forEach(ses => {
          const a = attendance.find(a => a.sessionId === ses.id && a.studentId === studentId)
          total++
          if (a?.present) present++
        })
      })
      return total ? Math.round((present / total) * 100) : null
    })

    const hasData = dataByMonth.some(d => d !== null)
    const tableRows = months.map((m, i) => ({ month: labels[i], rate: dataByMonth[i] != null ? `${dataByMonth[i]}%` : '—' }))
    const chartData = {
      labels,
      datasets: [{ data: dataByMonth, backgroundColor: 'rgba(30,64,175,0.7)', borderRadius: 6, spanGaps: true }],
    }
    return { chartData, tableRows, hasData }
  }, [classId, fromMonth, toMonth, sessions, attendance, enrolledStudentIds])

  return (
    <ReportCard
      title="Điểm Danh theo tháng"
      hasData={hasData}
      excelRows={tableRows}
      excelColumns={[{ key: 'month', label: 'Tháng' }, { key: 'rate', label: 'Tỉ lệ có mặt' }]}
      excelFilename="bao-cao-diem-danh"
      pdfFilename="bao-cao-diem-danh"
      filters={
        <div className="flex flex-wrap gap-2 items-center">
          <select className="select text-xs py-1" value={classId} onChange={e => setClassId(e.target.value)}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="month" className="input text-xs py-1 w-32" value={fromMonth} onChange={e => setFromMonth(e.target.value)} />
          <span className="text-navy-400 text-xs">→</span>
          <input type="month" className="input text-xs py-1 w-32" value={toMonth} onChange={e => setToMonth(e.target.value)} />
        </div>
      }
    >
      {!hasData
        ? <p className="text-sm text-navy-400 py-8 text-center">Chưa có dữ liệu điểm danh trong khoảng thời gian này</p>
        : <Bar data={chartData} options={{ ...CHART_OPTS, scales: { y: { beginAtZero: true, max: 100 } } }} />
      }
    </ReportCard>
  )
}

// ─── Mock Test card ───────────────────────────────────────
const MockTestCard = ({ classes, students }) => {
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [studentId, setStudentId] = useState('')
  const [mockTests, setMockTests] = useState([])
  const [results, setResults] = useState([])
  const [classStudents, setClassStudents] = useState([])

  useEffect(() => { setClassId(classes[0]?.id ?? '') }, [classes])

  useEffect(() => {
    if (!classId) return
    setStudentId('')
    Promise.all([
      getMockTestsByClass(classId),
      getMockTestResultsByClass(classId),
      getEnrollmentsByClass(classId),
    ]).then(([tests, res, enrollments]) => {
      setMockTests(tests)
      setResults(res)
      const activeIds = new Set(enrollments.filter(e => e.status !== 'dropped').map(e => e.studentId))
      setClassStudents(students.filter(s => activeIds.has(s.id)))
    })
  }, [classId, students])

  const { chartData, tableRows, hasData, excelCols } = useMemo(() => {
    if (!classId) return { chartData: null, tableRows: [], hasData: false, excelCols: [] }
    const orderedTests = [...mockTests].reverse()
    const targetStudents = studentId ? classStudents.filter(s => s.id === studentId) : classStudents.slice(0, 5)
    if (orderedTests.length < 2) return { chartData: null, tableRows: [], hasData: false, excelCols: [] }

    const labels = orderedTests.map(t => fmtDate(t.date))
    const datasets = targetStudents.map((s, i) => {
      const colors = ['#1e40af','#059669','#d97706','#dc2626','#7c3aed']
      const color = colors[i % colors.length]
      return {
        label: s.name,
        data: orderedTests.map(t => {
          const r = results.find(r => r.mockTestId === t.id && r.studentId === s.id)
          return r ? r.totalScore : null
        }),
        borderColor: color, backgroundColor: color + '20', tension: 0.3, spanGaps: true, pointRadius: 4,
      }
    })

    const tableRows = orderedTests.map((t, i) => ({
      date: labels[i],
      ...Object.fromEntries(targetStudents.map(s => {
        const r = results.find(r => r.mockTestId === t.id && r.studentId === s.id)
        return [s.name, r ? r.totalScore : '—']
      }))
    }))
    const excelCols = [{ key: 'date', label: 'Ngày' }, ...targetStudents.map(s => ({ key: s.name, label: s.name }))]
    return { chartData: { labels, datasets }, tableRows, hasData: true, excelCols }
  }, [classId, studentId, mockTests, results, classStudents])

  return (
    <ReportCard
      title="Tiến độ Mock Test"
      hasData={hasData}
      excelRows={tableRows}
      excelColumns={excelCols}
      excelFilename="bao-cao-mock-test"
      pdfFilename="bao-cao-mock-test"
      filters={
        <div className="flex flex-wrap gap-2 items-center">
          <select className="select text-xs py-1" value={classId} onChange={e => { setClassId(e.target.value); setStudentId('') }}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="select text-xs py-1" value={studentId} onChange={e => setStudentId(e.target.value)}>
            <option value="">Tất cả (tối đa 5)</option>
            {classStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      }
    >
      {!hasData
        ? <p className="text-sm text-navy-400 py-8 text-center">Cần ít nhất 2 mốc Mock Test để vẽ tiến độ</p>
        : <Line data={chartData} options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, legend: { display: classStudents.length > 1 } } }} />
      }
    </ReportCard>
  )
}

// ─── Fees card ────────────────────────────────────────────
const FeesReportCard = ({ students, enrollments, payments }) => {
  const [fromMonth, setFromMonth] = useState(sixMonthsAgo())
  const [toMonth, setToMonth] = useState(currentMonth())
  const [debtRows, setDebtRows] = useState([])

  const { chartData, tableRows, hasData } = useMemo(() => {
    const months = monthsBetween(fromMonth, toMonth)
    const labels = months.map(m => { const [y, mo] = m.split('-'); return `${mo}/${y}` })
    const activeEnrollments = enrollments.filter(e => e.status !== 'dropped')
    const totals = months.map(m => payments.filter(p => p.period === m).reduce((s, p) => s + (p.amount ?? 0), 0))
    const hasData = totals.some(t => t > 0)
    const tableRows = months.map((m, i) => ({ month: labels[i], total: fmtVND(totals[i]) }))
    const chartData = {
      labels,
      datasets: [{ data: totals, backgroundColor: 'rgba(5,150,105,0.7)', borderRadius: 6 }],
    }
    return { chartData, tableRows, hasData }
  }, [fromMonth, toMonth, payments, enrollments])

  useEffect(() => {
    const [ly, lm] = toMonth.split('-').map(Number)
    const activeEnrollments = enrollments.filter(e => e.status !== 'dropped')
    const eligible = students.filter(s => activeEnrollments.some(e => e.studentId === s.id))
    Promise.all(eligible.map(async s => {
      const paid = payments.filter(p => p.studentId === s.id && p.period === toMonth).reduce((sum, p) => sum + p.amount, 0)
      const expected = await calcFee(s.id, ly, lm)
      const debt = Math.max(0, expected - paid)
      return { name: s.name, paid: fmtVND(paid), expected: fmtVND(expected), debt: fmtVND(debt), _debt: debt }
    })).then(rows => setDebtRows(rows.filter(r => r._debt > 0)))
  }, [toMonth, students, enrollments, payments])

  return (
    <ReportCard
      title="Tổng thu Học Phí"
      hasData={hasData}
      excelRows={tableRows}
      excelColumns={[{ key: 'month', label: 'Tháng' }, { key: 'total', label: 'Tổng thu' }]}
      excelFilename="bao-cao-hoc-phi"
      pdfFilename="bao-cao-hoc-phi"
      filters={
        <div className="flex flex-wrap gap-2 items-center">
          <input type="month" className="input text-xs py-1 w-32" value={fromMonth} onChange={e => setFromMonth(e.target.value)} />
          <span className="text-navy-400 text-xs">→</span>
          <input type="month" className="input text-xs py-1 w-32" value={toMonth} onChange={e => setToMonth(e.target.value)} />
        </div>
      }
    >
      {!hasData
        ? <p className="text-sm text-navy-400 py-4 text-center">Chưa có dữ liệu thanh toán</p>
        : <Bar data={chartData} options={CHART_OPTS} />
      }
      {debtRows.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">Học viên còn nợ (tháng {toMonth.replace('-', '/')})</p>
          <div className="divide-y divide-navy-50">
            {debtRows.map((r, i) => (
              <div key={i} className="flex justify-between py-2 text-sm">
                <span className="text-navy-800">{r.name}</span>
                <span className="text-red-600 font-semibold">{r.debt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ReportCard>
  )
}

// ─── ReportsPage ──────────────────────────────────────────
export const ReportsPage = () => {
  const [classes, setClasses]       = useState([])
  const [students, setStudents]     = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [payments, setPayments]     = useState([])

  useEffect(() => {
    Promise.all([getClasses(), getStudents(), getEnrollments(), getAllPayments()]).then(
      ([cls, stu, enr, pay]) => { setClasses(cls); setStudents(stu); setEnrollments(enr); setPayments(pay) }
    )
  }, [])

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-900">Báo Cáo</h1>
        <p className="text-sm text-navy-400 mt-0.5">Tổng hợp điểm danh, Mock Test và học phí</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AttendanceCard classes={classes} />
        <MockTestCard classes={classes} students={students} />
      </div>
      <FeesReportCard students={students} enrollments={enrollments} payments={payments} />
    </div>
  )
}
