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

export const todayISO = () => new Date().toISOString().split('T')[0]

export const monthISO = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
