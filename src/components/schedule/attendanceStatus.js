// Trạng thái chấm công giáo viên — dùng chung giữa modal, card, agenda.
// Màu dùng Tailwind tokens (không hard-code hex).
export const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Đã dạy', icon: '✅', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200' },
  { value: 'absent',  label: 'Vắng',   icon: '❌', dot: 'bg-red-500',   text: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200'   },
  { value: 'makeup',  label: 'Dạy bù', icon: '🔄', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50',  border: 'border-amber-200' },
]

export const getAttendanceStatus = (value) =>
  ATTENDANCE_STATUSES.find(s => s.value === value) ?? null
