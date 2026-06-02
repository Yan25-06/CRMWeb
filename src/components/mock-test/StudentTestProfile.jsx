import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { clsx } from 'clsx'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js'
import { getInitials } from '@/utils/helpers'
import { upsertMockTestResult } from '@/services/mockTestService'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

const TestCard = ({ mockTest, result, onNoteChange, extraAction }) => {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(result?.teacherNote ?? '')
  const timerRef = useRef(null)

  useEffect(() => { setNote(result?.teacherNote ?? '') }, [result])

  const sections = mockTest.sections ?? []
  const maxTotal = sections.reduce((s, sec) => s + sec.maxScore, 0)
  const total = result?.totalScore ?? 0
  const pct = maxTotal > 0 && total > 0 ? Math.round((total / maxTotal) * 100) : null

  const handleNote = (val) => {
    setNote(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      upsertMockTestResult({
        mockTestId: mockTest.id,
        studentId: result?.studentId,
        scores: result?.scores ?? {},
        teacherNote: val,
      }).then(() => onNoteChange?.())
    }, 800)
  }

  return (
    <div className="border border-navy-100 rounded-2xl overflow-hidden">
      <div className="flex items-center">
        {extraAction && (
          <div className="pl-3 pr-1 shrink-0" onClick={e => e.stopPropagation()}>
            {extraAction}
          </div>
        )}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-navy-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-semibold text-navy-800 text-sm">{mockTest.title}</span>
            <span className="text-xs text-navy-400">{fmt(mockTest.date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pct !== null ? (
            <span className={clsx(
              'text-sm font-bold px-2.5 py-0.5 rounded-full',
              pct >= 80 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
            )}>
              {total}/{maxTotal} ({pct}%)
            </span>
          ) : (
            <span className="text-xs text-navy-300 font-medium">Chưa có điểm</span>
          )}
          {open ? <ChevronUp size={16} className="text-navy-400" /> : <ChevronDown size={16} className="text-navy-400" />}
        </div>
      </button>
      </div>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-navy-50">
          <table className="w-full text-sm mt-3">
            <thead>
              <tr className="text-xs text-navy-500 border-b border-navy-100">
                <th className="py-1.5 text-left font-medium">Phần thi</th>
                <th className="py-1.5 text-center font-medium">Điểm</th>
                <th className="py-1.5 text-center font-medium">Tối đa</th>
                <th className="py-1.5 text-center font-medium">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {sections.map(sec => {
                const score = result?.scores?.[sec.id]
                const secPct = (score !== undefined && score !== '') ? Math.round((Number(score) / sec.maxScore) * 100) : null
                return (
                  <tr key={sec.id} className="text-sm">
                    <td className="py-1.5 text-navy-700">{sec.name}</td>
                    <td className="py-1.5 text-center font-semibold text-navy-800">{score !== undefined && score !== '' ? score : '—'}</td>
                    <td className="py-1.5 text-center text-navy-400">{sec.maxScore}</td>
                    <td className={clsx('py-1.5 text-center font-semibold',
                      secPct === null ? 'text-navy-300' : secPct >= 80 ? 'text-emerald-600' : secPct >= 50 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {secPct !== null ? `${secPct}%` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-navy-500 uppercase tracking-wide">Nhận xét GV</label>
            <textarea
              rows={2}
              placeholder="Nhận xét cho học viên này..."
              value={note}
              onChange={e => handleNote(e.target.value)}
              className="input text-sm resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export const StudentTestProfile = ({ student, mockTests = [], results = [], renderExtraAction }) => {
  const chartRef = useRef(null)
  const [chartVisible, setChartVisible] = useState(false)

  useEffect(() => {
    if (!chartRef.current || mockTests.length < 2) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setChartVisible(true); observer.disconnect() }
    }, { threshold: 0.1 })
    observer.observe(chartRef.current)
    return () => observer.disconnect()
  }, [mockTests.length])

  if (!student) return null

  const testsWithResults = mockTests.map(t => ({
    test: t,
    result: results.find(r => r.mockTestId === t.id),
  }))

  const chartPoints = testsWithResults
    .filter(({ result }) => result?.totalScore > 0)
    .sort((a, b) => new Date(a.test.date) - new Date(b.test.date))

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-navy-800 text-white font-bold text-sm flex items-center justify-center shrink-0">
          {getInitials(student.name)}
        </div>
        <div>
          <p className="font-semibold text-navy-900">{student.name}</p>
          <p className="text-xs text-navy-400">{testsWithResults.length} bài kiểm tra</p>
        </div>
      </div>

      {/* Line chart — only if ≥2 results */}
      <div ref={chartRef}>
        {chartPoints.length >= 2 && chartVisible && (
          <div className="bg-white border border-navy-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-3">Tiến độ điểm tổng</p>
            <Line
              data={{
                labels: chartPoints.map(({ test }) => new Date(test.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })),
                datasets: [{
                  label: 'Điểm tổng',
                  data: chartPoints.map(({ result }) => result.totalScore),
                  borderColor: '#1e3a5f',
                  backgroundColor: 'rgba(30,58,95,0.08)',
                  tension: 0.3,
                  fill: true,
                  pointRadius: 5,
                  pointBackgroundColor: '#1e3a5f',
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        )}
      </div>

      {/* Test accordion list */}
      <div className="flex flex-col gap-2">
        {testsWithResults.length === 0 ? (
          <p className="text-sm text-navy-400 text-center py-8">Chưa có bài kiểm tra nào</p>
        ) : (
          testsWithResults.map(({ test, result }) => (
            <TestCard
              key={test.id}
              mockTest={test}
              result={result}
              extraAction={renderExtraAction ? renderExtraAction(test, result) : null}
            />
          ))
        )}
      </div>
    </div>
  )
}
