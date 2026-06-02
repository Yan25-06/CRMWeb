import { Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
export const DEFAULT_SECTIONS = () => [
  { id: crypto.randomUUID(), name: 'Listening', maxScore: 40, order: 0 },
  { id: crypto.randomUUID(), name: 'Reading',   maxScore: 40, order: 1 },
  { id: crypto.randomUUID(), name: 'Writing',   maxScore: 40, order: 2 },
  { id: crypto.randomUUID(), name: 'Speaking',  maxScore: 40, order: 3 },
]

export const MockTestSectionBuilder = ({ sections = [], onChange }) => {
  const update = (idx, field, value) => {
    const next = sections.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    onChange(next)
  }

  const remove = (idx) => {
    if (sections.length <= 1) return
    onChange(sections.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })))
  }

  const add = () => {
    onChange([...sections, { id: crypto.randomUUID(), name: '', maxScore: 40, order: sections.length }])
  }

  const move = (idx, dir) => {
    const next = [...sections]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next.map((s, i) => ({ ...s, order: i })))
  }

  return (
    <div className="flex flex-col gap-2">
      {sections.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              className="p-0.5 text-navy-300 hover:text-navy-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => move(idx, 1)}
              disabled={idx === sections.length - 1}
              className="p-0.5 text-navy-300 hover:text-navy-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Tên phần thi"
            value={s.name}
            onChange={e => update(idx, 'name', e.target.value)}
            className={clsx(
              'flex-1 input text-sm h-9',
              !s.name.trim() && 'border-red-300 focus:border-red-400'
            )}
          />
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Điểm tối đa"
            value={s.maxScore}
            onChange={e => update(idx, 'maxScore', Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            className="input text-sm h-9 w-24 text-center"
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            disabled={sections.length <= 1}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="mt-1 text-sm text-navy-500 hover:text-navy-800 font-medium flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-navy-50 transition-colors w-fit"
      >
        + Thêm phần thi
      </button>
    </div>
  )
}
