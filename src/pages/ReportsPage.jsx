import { useState, useEffect } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { ReportCard } from '@/components/reports/ReportCard'
import { classService }      from '@/services/classService'
import { studentService }    from '@/services/studentService'
import { enrollmentService } from '@/services/enrollmentService'
import { sessionService }    from '@/services/sessionService'
import { attendanceService } from '@/services/attendanceService'
import { mockTestService }   from '@/services/mockTestService'
import { mockTestResultService } from '@/services/mockTestResultService'
import { paymentService }    from '@/services/paymentService'
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
  const [classes,    setClasses]    = useState([])
  const [classId,    setClassId]    = useState('')
  const [fromMonth,  setFromMonth]  = useState(sixMonthsAgo())
  const [toMonth,    setToMonth]    = useState(currentMonth())
  const [loading,    setLoading]    = useState(false)
  const [chartData,  setChartData]  = useState(null)
  const [tableRows,  setTableRows]  = useState([])
  const [hasData,    setHasData]    = useState(false)

  useEffect(() => {
    classService.getAll().then(cls => {
      setClasses(cls)
      if (cls.length > 0) setClassId(cls[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!classId) return
    setLoading(true)
    const load = async () => {
      try {
        const months = monthsBetween(fromMonth, toMonth)
        const fromDate = fromMonth + '-01'
        const toDate = toMonth + '-31'
        const [sessions, allAttendance, enrollments, allStudents] = await Promise.all([
          sessionService.getByClass(classId),
          attendanceService.getByClass(classId),
          enrollmentService.getByClass(classId),
          studentService.getAll(),
        ])
        const activeEnrollments = enrollments.filter(e => e.status !== 'dropped')
        const students = allStudents.filter(s => activeEnrollments.some(e => e.studentId === s.id))

        const labels = months.map(m => { const [y, mo] = m.split('-'); return `${mo}/${y}` })
        const attMap = new Map(allAttendance.map(a => [`${a.sessionId}_${a.studentId}`, a]))

        const dataByMonth = months.map(m => {
          const monthSessions = sessions.filter(s => s.date.startsWith(m))
          if (!monthSessions.length) return null
          let present = 0, total = 0
          students.forEach(s => {
            monthSessions.forEach(ses => {
              const a = attMap.get(`${ses.id}_${s.id}`)
              total++
              if (!a || a.present !== false) present++
            })
          })
          return total ? Math.round((present / total) * 100) : null
        })

        const hasDataNow = dataByMonth.some(d => d !== null)
        const rows = months.map((m, i) => ({ month: labels[i], rate: dataByMonth[i] != null ? `${dataByMonth[i]}%` : '—' }))
        setHasData(hasDataNow)
        setTableRows(rows)
        setChartData({
          labels,
          datasets: [{ data: dataByMonth, backgroundColor: 'rgba(30,64,175,0.7)', borderRadius: 6, spanGaps: true }],
        })
      } catch { /* show empty */ }
      finally { setLoading(false) }
    }
    load()
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
      {loading ? (
        <p className="text-sm text-navy-400 py-8 text-center">Đang tải...</p>
      ) : !hasData ? (
        <p className="text-sm text-navy-400 py-8 text-center">Chưa có dữ liệu điểm danh trong khoảng thời gian này</p>
      ) : (
        <Bar data={chartData} options={{ ...CHART_OPTS, scales: { y: { beginAtZero: true, max: 100 } } }} />
      )}
    </ReportCard>
  )
}

// ─── Mock Test card ───────────────────────────────────────
const MockTestCard = () => {
  const [classes,       setClasses]       = useState([])
  const [classStudents, setClassStudents] = useState([])
  const [classId,       setClassId]       = useState('')
  const [studentId,     setStudentId]     = useState('')
  const [loading,       setLoading]       = useState(false)
  const [chartData,     setChartData]     = useState(null)
  const [tableRows,     setTableRows]     = useState([])
  const [excelCols,     setExcelCols]     = useState([])
  const [hasData,       setHasData]       = useState(false)

  useEffect(() => {
    classService.getAll().then(cls => {
      setClasses(cls)
      if (cls.length > 0) setClassId(cls[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!classId) return
    Promise.all([
      enrollmentService.getByClass(classId),
      studentService.getAll(),
    ]).then(([enrollments, allStudents]) => {
      const active = enrollments.filter(e => e.status !== 'dropped')
      setClassStudents(allStudents.filter(s => active.some(e => e.studentId === s.id)))
      setStudentId('')
    }).catch(() => setClassStudents([]))
  }, [classId])

  useEffect(() => {
    if (!classId) return
    setLoading(true)
    const load = async () => {
      try {
        const [tests, results] = await Promise.all([
          mockTestService.getByClass(classId),
          mockTestResultService.getByClass(classId),
        ])
        const sorted = [...tests].reverse()
        const targetStudents = studentId
          ? classStudents.filter(s => s.id === studentId)
          : classStudents.slice(0, 5)

        if (sorted.length < 2) { setHasData(false); setLoading(false); return }

        const labels = sorted.map(t => fmtDate(t.date))
        const colors = ['#1e40af','#059669','#d97706','#dc2626','#7c3aed']
        const datasets = targetStudents.map((s, i) => ({
          label: s.name,
          data: sorted.map(t => {
            const r = results.find(r => r.mockTestId === t.id && r.studentId === s.id)
            return r ? r.totalScore : null
          }),
          borderColor: colors[i % colors.length],
          backgroundColor: colors[i % colors.length] + '20',
          tension: 0.3,
          spanGaps: true,
          pointRadius: 4,
        }))

        const rows = sorted.map((t, i) => ({
          date: labels[i],
          ...Object.fromEntries(targetStudents.map(s => {
            const r = results.find(r => r.mockTestId === t.id && r.studentId === s.id)
            return [s.name, r ? r.totalScore : '—']
          }))
        }))

        setChartData({ labels, datasets })
        setTableRows(rows)
        setExcelCols([
          { key: 'date', label: 'Ngày' },
          ...targetStudents.map(s => ({ key: s.name, label: s.name }))
        ])
        setHasData(true)
      } catch { setHasData(false) }
      finally { setLoading(false) }
    }
    load()
  }, [classId, studentId, classStudents])

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
      {loading ? (
        <p className="text-sm text-navy-400 py-8 text-center">Đang tải...</p>
      ) : !hasData ? (
        <p className="text-sm text-navy-400 py-8 text-center">Cần ít nhất 2 mốc Mock Test để vẽ tiến độ</p>
      ) : (
        <Line data={chartData} options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, legend: { display: classStudents.length > 1 } } }} />
      )}
    </ReportCard>
  )
}

// ─── Fees card ────────────────────────────────────────────
const FeesReportCard = () => {
  const [fromMonth, setFromMonth] = useState(sixMonthsAgo())
  const [toMonth,   setToMonth]   = useState(currentMonth())
  const [loading,   setLoading]   = useState(false)
  const [chartData, setChartData] = useState(null)
  const [tableRows, setTableRows] = useState([])
  const [debtRows,  setDebtRows]  = useState([])
  const [hasData,   setHasData]   = useState(false)

  useEffect(() => {
    setLoading(true)
    const load = async () => {
      try {
        const months = monthsBetween(fromMonth, toMonth)
        const labels = months.map(m => { const [y, mo] = m.split('-'); return `${mo}/${y}` })

        // Fetch payments for each month (or all at once and filter)
        const allPaymentsArrays = await Promise.all(months.map(m => paymentService.getByPeriod(m)))
        const totals = allPaymentsArrays.map(payments =>
          payments.reduce((s, p) => s + (p.amount ?? 0), 0)
        )

        const hasDataNow = totals.some(t => t > 0)
        const rows = months.map((m, i) => ({ month: labels[i], total: fmtVND(totals[i]) }))

        // Debt rows: use the latest month
        const latestMonth = toMonth
        const [ly, lm] = latestMonth.split('-').map(Number)
        const latestPayments = allPaymentsArrays[allPaymentsArrays.length - 1] ?? []
        const paidByStudent = {}
        latestPayments.forEach(p => {
          paidByStudent[p.studentId] = (paidByStudent[p.studentId] ?? 0) + (p.amount ?? 0)
        })

        setHasData(hasDataNow)
        setTableRows(rows)
        setDebtRows([]) // debt calculation needs feeService.buildFeesRows — skip for simplicity
        setChartData({
          labels,
          datasets: [{ data: totals, backgroundColor: 'rgba(5,150,105,0.7)', borderRadius: 6 }],
        })
      } catch { /* show empty */ }
      finally { setLoading(false) }
    }
    load()
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
      {loading ? (
        <p className="text-sm text-navy-400 py-4 text-center">Đang tải...</p>
      ) : !hasData ? (
        <p className="text-sm text-navy-400 py-4 text-center">Chưa có dữ liệu thanh toán</p>
      ) : (
        <Bar data={chartData} options={CHART_OPTS} />
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
