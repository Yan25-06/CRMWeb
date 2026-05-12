import { useState } from 'react'
import { clsx } from 'clsx'

export const ProgressBadge = ({ progress = 0, onChange, disabled }) => {
  const [animate, setAnimate] = useState(false)

  const config = {
    0: { label: 'Không nộp', className: 'bg-red-100 text-red-700 hover:bg-red-200' },
    50: { label: 'Chưa hoàn tất', className: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    100: { label: 'Hoàn tất', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' }
  }

  const current = config[progress] || config[0]

  const handleClick = () => {
    if (disabled) return
    
    // Trigger animation
    setAnimate(true)
    setTimeout(() => setAnimate(false), 200)

    // Cycle: 0 -> 50 -> 100 -> 0
    let next = 0
    if (progress === 0) next = 50
    else if (progress === 50) next = 100
    else if (progress === 100) next = 0

    onChange?.(next)
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        "px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-all select-none whitespace-nowrap",
        current.className,
        disabled && "opacity-60 cursor-not-allowed hover:bg-inherit",
        animate && "scale-110",
        !disabled && !animate && "hover:scale-105 active:scale-95"
      )}
    >
      {current.label}
    </button>
  )
}
