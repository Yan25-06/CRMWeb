import { clsx } from 'clsx'

const fmt = (n) =>
  n == null || n === '' ? '' : new Intl.NumberFormat('vi-VN').format(n)

// value = full VND integer (e.g. 1400000)
// Displays the thousands part (value ÷ 1000) with ".000đ" as a fixed suffix.
// onChange returns full integer (thousands * 1000).
export const CurrencyInput = ({ label, value, onChange, error, className, ...rest }) => {
  const thousands = value === '' || value == null ? '' : Math.floor(Number(value) / 1000)
  const displayValue = thousands === '' ? '' : fmt(thousands)

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '')
    if (digits === '') { onChange(''); return }
    const n = parseInt(digits, 10)
    onChange(isNaN(n) ? 0 : n * 1000)
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-navy-700">{label}</label>}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={clsx(
            'input pr-14',
            error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
            className
          )}
          {...rest}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-navy-500 pointer-events-none select-none">
          .000đ
        </span>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
