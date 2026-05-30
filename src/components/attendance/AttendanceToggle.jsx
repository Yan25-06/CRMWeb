import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { Check, X } from 'lucide-react'

export const AttendanceToggle = ({ present, onChange, disabled }) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const cycleState = () => {
    if (disabled) return
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 150)
    if (present === null) onChange(true)
    else if (present === true) onChange(false)
    else onChange(null)
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
        present === null && 'border border-navy-200 bg-white text-navy-600 hover:bg-navy-50 hover:border-navy-300',
        present === true && 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
        present === false && 'bg-red-600 text-white shadow-sm hover:bg-red-700'
      )}
    >
      {present === null && '—'}
      {present === true && <><Check size={14} strokeWidth={3} /> Có</>}
      {present === false && <><X size={14} strokeWidth={3} /> Vắng</>}
    </button>
  )
}
