// Loại tài liệu giảng dạy — dùng chung bởi MaterialsTab và MaterialModal.
export const MATERIAL_TYPES = [
  { value: 'slide',     label: 'Slide',         badge: 'bg-blue-100 text-blue-700' },
  { value: 'handout',   label: 'Handout',       badge: 'bg-green-100 text-green-700' },
  { value: 'listening', label: 'Bài tập nghe',  badge: 'bg-purple-100 text-purple-700' },
  { value: 'speaking',  label: 'Bài tập nói',   badge: 'bg-orange-100 text-orange-700' },
  { value: 'other',     label: 'Khác',          badge: 'bg-navy-50 text-navy-700' },
]

const TYPE_MAP = Object.fromEntries(MATERIAL_TYPES.map(t => [t.value, t]))

export const getMaterialType = (value) => TYPE_MAP[value] ?? TYPE_MAP.other
