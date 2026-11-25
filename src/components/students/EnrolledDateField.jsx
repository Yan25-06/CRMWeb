import { useId } from 'react'

// Ô chọn "Ngày vào lớp" (enrollments.enrolled_at) — giá trị dạng 'YYYY-MM-DD'.
// Các buổi trước ngày này không hiện trong danh sách điểm danh và không tính
// vào chuyên cần của học viên (xem utils/attendance.js).
export const EnrolledDateField = ({ value, onChange }) => {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-navy-700">Ngày vào lớp</label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input py-2 text-sm"
        required
      />
      <p className="text-xs text-navy-500">
        Các buổi trước ngày này không tính vào điểm danh và chuyên cần.
      </p>
    </div>
  )
}
