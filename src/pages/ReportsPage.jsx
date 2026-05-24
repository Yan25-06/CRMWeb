import { useState, useMemo } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { ReportCard } from '@/components/reports/ReportCard'
import {
  getStudents, getClasses, getEnrollments, getEnrollmentsByClass,
  getSessionsByClass, getAttendance, getMockTests, getMockTestResults,
  getMockTestsByClass, getPayments, calcFee,
} from '@/store/db'
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
const AttendanceCard = () => {
  const classes = getClasses()
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [fromMonth, setFromMonth] = useState(sixMonthsAgo())
  const [toMonth, setToMonth] = useState(currentMonth())

  const { chartData, tableRows, hasData } = useMemo(() => {
    if (!classId) return { chartData: null, tableRows: [], hasData: false }
    const months = monthsBetween(fromMonth, toMonth)
    const sessions = getSessionsByClass(classId)
    const att = getAttendance()
    const enrollments = getEnrollmentsByClass(classId).filter(e => e.status !== 'dropped')
    const students = getStudents().filter(s => enrollments.some(e => e.studentId === s.id))

    const labels = months.map(m => {
      const [y, mo] = m.split('-')
      return `${mo}/${y}`
    })

    const dataByMonth = months.map(m => {
      const monthSessions = sessions.filter(s => s.date.startsWith(m))
      if (!monthSessions.length) return null
      const sessionIds = new Set(monthSessions.map(s => s.id))
      let present = 0, total = 0
      students.forEach(s => {
        monthSessions.forEach(ses => {
          const a = att.find(a => a.sessionId === ses.id && a.studentId === s.id)
          total++
          if (a?.present) present++
        })
      })
      return total ? Math.round((present / total) * 100) : null
    })

    const hasData = dataByMonth.some(d => d !== null)

    const tableRows = months.map((m, i) => ({
      month: labels[i],
      rate: dataByMonth[i] != null ? `${dataByMonth[i]}%` : '—',
    }))

    const chartData = {
      labels,
      datasets: [{
        data: dataByMonth,
        backgroundColor: 'rgba(30,64,175,0.7)',
        borderRadius: 6,
        spanGaps: true,
      }],
    }

    return { chartData, tableRows, hasData }
  }, [classId, fromMonth, toMonth])

  const excelCols = [{ key: 'month', label: 'Tháng' }, { key: 'rate', label: 'Tỉ lệ có mặt' }]

  return (
    <ReportCard
      title="Điểm Danh theo tháng"
      hasData={hasData}
      excelRows={tableRows}
      excelColumns={excelCols}
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
const MockTestCard = () => {
  const classes = getClasses()
  const students = getStudents()
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [studentId, setStudentId] = useState('')

  const classStudents = useMemo(() => {
    if (!classId) return []
    const enrollments = getEnrollmentsByClass(classId).filter(e => e.status !== 'dropped')
    return students.filter(s => enrollments.some(e => e.studentId === s.id))
  }, [classId])

  const { chartData, tableRows, hasData } = useMemo(() => {
    if (!classId) return { chartData: null, tableRows: [], hasData: false }
    const tests = getMockTestsByClass(classId).slice().reverse()
    const results = getMockTestResults()

    const targetStudents = studentId
      ? classStudents.filter(s => s.id === studentId)
      : classStudents.slice(0, 5)

    if (tests.length < 2) return { chartData: null, tableRows: [], hasData: false }

    const labels = tests.map(t => fmtDate(t.date))
    const datasets = targetStudents.map((s, i) => {
      const colors = ['#1e40af','#059669','#d97706','#dc2626','#7c3aed']
      const color = colors[i % colors.length]
      return {
        label: s.name,
        data: tests.map(t => {
          const r = results.find(r => r.mockTestId === t.id && r.studentId === s.id)
          return r ? r.totalScore : null
        }),
        borderColor: color,
        backgroundColor: color + '20',
        tension: 0.3,
        spanGaps: true,
        pointRadius: 4,
      }
    })

    const tableRows = tests.map((t, i) => ({
      date: labels[i],
      ...Object.fromEntries(targetStudents.map(s => {
        const r = results.find(r => r.mockTestId === t.id && r.studentId === s.id)
        return [s.name, r ? r.totalScore : '—']
      }))
    }))

    const excelCols = [
      { key: 'date', label: 'Ngày' },
      ...targetStudents.map(s => ({ key: s.name, label: s.name }))
    ]

    return {
      chartData: { labels, datasets },
      tableRows,
      hasData: true,
      excelCols,
    }
  }, [classId, studentId, classStudents])

  const excelCols = hasData
    ? [{ key: 'date', label: 'Ngày' }, ...classStudents.map(s => ({ key: s.name, label: s.name }))]
    : []

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
const FeesReportCard = () => {
  const [fromMonth, setFromMonth] = useState(sixMonthsAgo())
  const [toMonth, setToMonth] = useState(currentMonth())

  const { chartData, tableRows, debtRows, hasData } = useMemo(() => {
    const months = monthsBetween(fromMonth, toMonth)
    const payments = getPayments()
    const students = getStudents()
    const enrollments = getEnrollments().filter(e => e.status !== 'dropped')

    const labels = months.map(m => {
      const [y, mo] = m.split('-')
      return `${mo}/${y}`
    })

    const totals = months.map(m =>
      payments.filter(p => p.period === m).reduce((s, p) => s + (p.amount ?? 0), 0)
    )

    const hasData = totals.some(t => t > 0)

    const tableRows = months.map((m, i) => ({ month: labels[i], total: fmtVND(totals[i]) }))

    const latestMonth = toMonth
    const [ly, lm] = latestMonth.split('-').map(Number)
    const debtRows = students
      .filter(s => enrollments.some(e => e.studentId === s.id))
      .map(s => {
        const paid = payments.filter(p => p.studentId === s.id && p.period === latestMonth).reduce((sum, p) => sum + p.amount, 0)
        const expected = calcFee(s.id, ly, lm)
        const debt = Math.max(0, expected - paid)
        return { name: s.name, paid: fmtVND(paid), expected: fmtVND(expected), debt: fmtVND(debt), _debt: debt }
      })
      .filter(r => r._debt > 0)

    const chartData = {
      labels,
      datasets: [{
        data: totals,
        backgroundColor: 'rgba(5,150,105,0.7)',
        borderRadius: 6,
      }],
    }

    return { chartData, tableRows, debtRows, hasData }
  }, [fromMonth, toMonth])

  const excelCols = [{ key: 'month', label: 'Tháng' }, { key: 'total', label: 'Tổng thu' }]

  return (
    <ReportCard
      title="Tổng thu Học Phí"
      hasData={hasData}
      excelRows={tableRows}
      excelColumns={excelCols}
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
export const ReportsPage = () => (
  <div className="flex flex-col gap-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-display font-bold text-navy-900">Báo Cáo</h1>
      <p className="text-sm text-navy-400 mt-0.5">Tổng hợp điểm danh, Mock Test và học phí</p>
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <AttendanceCard />
      <MockTestCard />
    </div>
    <FeesReportCard />
  </div>
)
