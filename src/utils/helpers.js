export const getInitials = (name = '') => {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const fmtVND = (amount) =>
  new Intl.NumberFormat('vi-VN').format(amount ?? 0) + 'đ'

export const fmtDate = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// Cắt chuỗi giờ Postgres "HH:MM:SS" → "HH:MM"
export const fmtTime = (t) => (t || '').slice(0, 5)

// Mảng thứ JS (0=CN…6=T7) → chuỗi "T2, T4, T6". Sắp theo thứ tự T2→CN.
const DAY_LABELS = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' }
const DAY_SORT = [1, 2, 3, 4, 5, 6, 0]
export const fmtDayList = (days = []) => {
  if (!Array.isArray(days) || days.length === 0) return '—'
  return [...days].sort((a, b) => DAY_SORT.indexOf(a) - DAY_SORT.indexOf(b))
    .map(d => DAY_LABELS[d] ?? '?').join(', ')
}

export const todayISO = () => new Date().toISOString().split('T')[0]

export const monthISO = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
