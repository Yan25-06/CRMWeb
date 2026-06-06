import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { mockTestResultService } from '@/services/mockTestResultService'
import { enqueueRetry } from '@/utils/retryQueue'
import { getInitials } from '@/utils/helpers'
import { toast } from '@/components/ui'

const ScoreCell = ({ section, value, onChange }) => {
  const [local, setLocal] = useState(value ?? '')

  useEffect(() => { setLocal(value ?? '') }, [value])

  const handleBlur = () => {
    if (local === '') { onChange(''); return }
    let num = Number(local)
    if (isNaN(num)) num = 0
    if (num > section.maxScore) {
      num = section.maxScore
      toast.warning(`Điểm tối đa ${section.name}: ${section.maxScore}`)
    }
    if (num < 0) num = 0
    setLocal(num)
    onChange(num)
  }

  return (
    <td className="px-1.5 py-2 text-center">
      <input
        type="number"
        min={0}
        max={section.maxScore}
        placeholder="—"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={handleBlur}
        className="w-14 text-center input h-8 text-sm px-1 tabular-nums"
        title={`${section.name} (tối đa ${section.maxScore})`}
      />
    </td>
  )
}

export const MockTestScoreTable = ({ mockTest, results = [], students = [], onResultChange }) => {
  const noteTimers = useRef({})
  const [notes, setNotes] = useState({})
  const [localResults, setLocalResults] = useState(results)

  // Sync from prop only when switching to a different mockTest (fresh load), not on every save
  useEffect(() => {
    setLocalResults(results)
    const m = {}
    results.forEach(r => { m[r.studentId] = r.teacherNote ?? '' })
    setNotes(m)
  }, [mockTest?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mockTest) return null

  const sections = mockTest.sections ?? []
  const maxTotal = sections.reduce((s, sec) => s + sec.maxScore, 0)

  const activeSectionNames = new Set(sections.map(s => s.name))
  const orphanNames = new Set()
  localResults.forEach(r => Object.keys(r.scores ?? {}).forEach(name => {
    if (!activeSectionNames.has(name)) orphanNames.add(name)
  }))
  const orphanArr = [...orphanNames]

  const handleScoreChange = async (student, sectionName, val) => {
    const existing = localResults.find(r => r.studentId === student.id)
    const newScores = { ...(existing?.scores ?? {}), [sectionName]: val }
    const newTotal = sections.reduce((s, sec) => s + (Number(newScores[sec.name]) || 0), 0)

    // Optimistic local update — does not touch other students' cells
    setLocalResults(prev => {
      if (prev.some(r => r.studentId === student.id)) {
        return prev.map(r => r.studentId === student.id
          ? { ...r, scores: newScores, totalScore: newTotal }
          : r)
      }
      return [...prev, { mockTestId: mockTest.id, studentId: student.id, scores: newScores, totalScore: newTotal, teacherNote: '' }]
    })

    const data = {
      mockTestId: mockTest.id,
      studentId: student.id,
      scores: newScores,
      teacherNote: existing?.teacherNote ?? '',
    }
    try {
      const updated = await mockTestResultService.upsert(data)
      onResultChange?.(updated)
    } catch {
      if (!navigator.onLine) {
        enqueueRetry(() => mockTestResultService.upsert(data).then(r => onResultChange?.(r)))
        toast.warning('Mất kết nối. Điểm sẽ tự lưu khi có mạng.')
      } else {
        toast.error('Không lưu được điểm')
      }
    }
  }

  const handleNoteChange = (studentId, val) => {
    setNotes(prev => ({ ...prev, [studentId]: val }))
    clearTimeout(noteTimers.current[studentId])
    noteTimers.current[studentId] = setTimeout(async () => {
      const result = localResults.find(r => r.studentId === studentId)
      const data = {
        mockTestId: mockTest.id,
        studentId,
        scores: result?.scores ?? {},
        teacherNote: val,
      }
      try {
        await mockTestResultService.upsert(data)
        onResultChange?.()
      } catch {
        if (!navigator.onLine) {
          enqueueRetry(() => mockTestResultService.upsert(data).then(() => onResultChange?.()))
        }
      }
    }, 800)
  }

  const avgPerSection = sections.map(sec => {
    const vals = localResults.map(r => r.scores?.[sec.name]).filter(v => v !== undefined && v !== '')
    if (!vals.length) return null
    return Math.round(vals.reduce((a, b) => a + Number(b), 0) / vals.length)
  })
  const totals = localResults.map(r => r.totalScore ?? 0).filter(v => v > 0)
  const avgTotal = totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead>
          <tr className="bg-navy-50/60 border-b border-navy-100">
            <th className="px-4 py-3 font-semibold text-navy-800 min-w-[160px]">Học viên</th>
            {sections.map(s => (
              <th key={s.name} className="px-1.5 py-3 font-semibold text-navy-700 text-center w-16">
                <div className="text-xs">{s.name}</div>
                <div className="text-xs text-navy-400 font-normal">/{s.maxScore}</div>
              </th>
            ))}
            {orphanArr.map(sid => (
              <th key={sid} className="px-1.5 py-3 font-medium text-navy-300 text-center w-16 text-xs">(Đã xóa)</th>
            ))}
            <th className="px-3 py-3 font-semibold text-navy-800 text-center">Tổng</th>
            <th className="px-3 py-3 font-semibold text-navy-800 text-center w-14">%</th>
            <th className="px-4 py-3 font-semibold text-navy-800 min-w-[180px]">Nhận xét GV</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-50">
          {students.map(student => {
            const result = localResults.find(r => r.studentId === student.id)
            const scores = result?.scores ?? {}
            const total = result?.totalScore ?? 0
            const pct = maxTotal > 0 && total > 0 ? Math.round((total / maxTotal) * 100) : null

            return (
              <tr key={student.id} className="hover:bg-navy-50/30 transition-colors">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-navy-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {getInitials(student.name)}
                    </div>
                    <span className="font-medium text-navy-900">{student.name}</span>
                  </div>
                </td>
                {sections.map(sec => (
                  <ScoreCell
                    key={sec.name}
                    section={sec}
                    value={scores[sec.name]}
                    onChange={val => handleScoreChange(student, sec.name, val)}
                  />
                ))}
                {orphanArr.map(sid => (
                  <td key={sid} className="px-1.5 py-2 text-center text-navy-300 text-xs">{scores[sid] ?? '—'}</td>
                ))}
                <td className="px-3 py-2 text-center font-semibold text-navy-800 tabular-nums">
                  {total > 0 ? `${total} / ${maxTotal}` : '—'}
                </td>
                <td className={clsx('px-3 py-2 text-center font-semibold tabular-nums',
                  pct === null ? 'text-navy-300' : pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {pct !== null ? `${pct}%` : '—'}
                </td>
                <td className="px-4 py-2">
                  <textarea
                    rows={2}
                    placeholder="Nhận xét..."
                    value={notes[student.id] ?? ''}
                    onChange={e => handleNoteChange(student.id, e.target.value)}
                    className="input text-xs resize-none w-full min-w-[160px] py-1.5"
                    style={{ minHeight: 32 }}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
        {students.length > 0 && (
          <tfoot>
            <tr className="bg-navy-50/40 border-t-2 border-navy-100">
              <td className="px-4 py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide">Trung bình lớp</td>
              {sections.map((s, i) => (
                <td key={s.name} className="px-1.5 py-2.5 text-center font-semibold text-navy-600 tabular-nums">
                  {avgPerSection[i] !== null ? avgPerSection[i] : '—'}
                </td>
              ))}
              {orphanArr.map(sid => <td key={sid} />)}
              <td className="px-3 py-2.5 text-center font-semibold text-navy-700 tabular-nums">
                {avgTotal !== null ? `${avgTotal} / ${maxTotal}` : '—'}
              </td>
              <td className="px-3 py-2.5 text-center font-semibold text-navy-700 tabular-nums">
                {avgTotal !== null ? `${Math.round((avgTotal / maxTotal) * 100)}%` : '—'}
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
