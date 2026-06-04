import { useState } from 'react'
import { clsx } from 'clsx'

export const AttendanceToggle = ({ present, onChange, disabled }) => {
  const [animate, setAnimate] = useState(false)

  const handleClick = () => {
    if (disabled) return
    setAnimate(true)
    setTimeout(() => setAnimate(false), 200)
    onChange(!present)
  }

  const cfg = present === false
    ? { label: 'Vắng',   className: 'bg-red-100 text-red-700 hover:bg-red-200' }
    : { label: 'Có mặt', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        'px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-all select-none whitespace-nowrap',
        cfg.className,
        disabled && 'opacity-60 cursor-not-allowed hover:bg-inherit',
        animate && 'scale-110',
        !disabled && !animate && 'hover:scale-105 active:scale-95'
      )}
    >
      {cfg.label}
    </button>
  )
}
