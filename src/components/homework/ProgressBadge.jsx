import { useState } from 'react'
import { clsx } from 'clsx'

const CYCLE = ['done', 'in_progress', 'not_done']

const CONFIG = {
  not_done:    { label: 'Không nộp',    className: 'bg-red-100 text-red-700 hover:bg-red-200' },
  in_progress: { label: 'Chưa hoàn tất', className: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  done:        { label: 'Hoàn tất',      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
}

// Backward compat: accept legacy numeric progress
const normalize = (p) => {
  if (p === 0 || p === 'not_done') return 'not_done'
  if (p === 50 || p === 'in_progress') return 'in_progress'
  if (p === 100 || p === 'done') return 'done'
  return 'not_done'
}

export const ProgressBadge = ({ progress = 'not_done', onChange, disabled }) => {
  const [animate, setAnimate] = useState(false)
  const current = normalize(progress)
  const cfg = CONFIG[current]

  const handleClick = () => {
    if (disabled) return
    setAnimate(true)
    setTimeout(() => setAnimate(false), 200)
    const idx = CYCLE.indexOf(current)
    onChange?.(CYCLE[(idx + 1) % CYCLE.length])
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        "px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-all select-none whitespace-nowrap",
        cfg.className,
        disabled && "opacity-60 cursor-not-allowed hover:bg-inherit",
        animate && "scale-110",
        !disabled && !animate && "hover:scale-105 active:scale-95"
      )}
    >
      {cfg.label}
    </button>
  )
}
