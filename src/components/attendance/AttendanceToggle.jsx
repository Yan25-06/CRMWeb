import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { Check, X } from 'lucide-react'

export const AttendanceToggle = ({ present, onChange, disabled }) => {
  const [isAnimating, setIsAnimating] = useState(false)

  // Binary model: mặc định "Có mặt", tick để chuyển sang "Vắng" và ngược lại.
  const cycleState = () => {
    if (disabled) return
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 150)
    onChange(!present)
  }

  if (disabled) {
    return (
      <div className="inline-flex items-center justify-center w-20 h-8 rounded-lg border border-navy-100 bg-navy-50 text-navy-300 text-sm font-medium opacity-60 select-none">
        —
      </div>
    )
  }

  return (
    <button
      onClick={cycleState}
      className={clsx(
        'inline-flex items-center justify-center gap-1 w-20 h-8 rounded-lg text-sm font-medium transition-all duration-150 select-none',
        isAnimating && 'scale-90',
        present === false
          ? 'bg-red-600 text-white shadow-sm hover:bg-red-700'
          : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
      )}
    >
      {present === false
        ? <><X size={14} strokeWidth={3} /> Vắng</>
        : <><Check size={14} strokeWidth={3} /> Có</>}
    </button>
  )
}
