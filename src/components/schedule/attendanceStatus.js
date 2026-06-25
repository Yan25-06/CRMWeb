// Trạng thái chấm công giáo viên — dùng chung giữa modal, card, agenda.
// Màu dùng Tailwind tokens (không hard-code hex).
// 3 trạng thái: pending (Chưa xác nhận) / present (Đã dạy) / absent (Vắng). 'pending' chỉ hiển thị, không ghi DB.
export const ATTENDANCE_STATUSES = [
  { value: 'pending', label: 'Chưa xác nhận', dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-300', bar: 'border-l-slate-300' },
  { value: 'present', label: 'Đã dạy', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', bar: 'border-l-green-500' },
  { value: 'absent',  label: 'Vắng',   dot: 'bg-red-500',   text: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200',   bar: 'border-l-red-500'   },
]

export const getAttendanceStatus = (value) =>
  ATTENDANCE_STATUSES.find(s => s.value === value) ?? null
