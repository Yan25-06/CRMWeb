import { useState, useEffect } from 'react'
import { toast } from '@/components/ui'

export const ScoreInputRow = ({ sections = [], scores = {}, onChange }) => {
  const [local, setLocal] = useState(scores)

  useEffect(() => { setLocal(scores) }, [scores])

  const entered = sections.filter(s => local[s.id] !== undefined && local[s.id] !== '')
  const sumScores = entered.reduce((t, s) => t + (Number(local[s.id]) || 0), 0)
  const sumMax = entered.reduce((t, s) => t + s.maxScore, 0)

  const handleChange = (sectionId, val) => {
    setLocal(prev => ({ ...prev, [sectionId]: val }))
  }

  const handleBlur = (section, val) => {
    if (val === '' || val === undefined) {
      const next = { ...local, [section.id]: '' }
      setLocal(next)
      onChange?.(next)
      return
    }
    let num = Number(val)
    if (isNaN(num)) num = 0
    if (num > section.maxScore) {
      num = section.maxScore
      toast.warning(`Điểm tối đa cho ${section.name} là ${section.maxScore}`)
    }
    if (num < 0) num = 0
    const next = { ...local, [section.id]: num }
    setLocal(next)
    onChange?.(next)
  }

  return (
    <div className="flex items-center gap-1.5">
      {sections.map(s => (
        <input
          key={s.id}
          type="number"
          min={0}
          max={s.maxScore}
          placeholder="—"
          value={local[s.id] ?? ''}
          onChange={e => handleChange(s.id, e.target.value)}
          onBlur={e => handleBlur(s, e.target.value)}
          className="w-14 text-center input h-8 text-sm px-1 tabular-nums"
          title={`${s.name} (tối đa ${s.maxScore})`}
        />
      ))}
      <span className="text-sm font-semibold text-navy-700 whitespace-nowrap min-w-[64px] text-right tabular-nums">
        {entered.length > 0 ? `${sumScores} / ${sumMax}` : '—'}
      </span>
    </div>
  )
}
