import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { Trash2 } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { ATTENDANCE_STATUSES } from './attendanceStatus'

const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

const formatDateLabel = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAY_NAMES[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`
}

/**
 * TeacherAttendanceModal — admin chấm công 1 ca trên 1 ngày
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Object}   cls     - class info (name)
 * @param {string}   date    - 'YYYY-MM-DD'
 * @param {Object}   record  - record hiện có hoặc null
 * @param {Function} onSave  - callback({ status, note })
 * @param {Function} onDelete- callback() — xóa record (chỉ khi đã có record)
 */
export const TeacherAttendanceModal = ({ open, onClose, cls, date, record, onSave, onDelete }) => {
  const [status, setStatus] = useState('present')
  const [note, setNote] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (open) {
      setStatus(record?.status ?? 'present')
      setNote(record?.note ?? '')
      setConfirmDelete(false)
    }
  }, [open, record])

  const handleSave = () => {
    onSave?.({ status, note: note.trim() })
    onClose?.()
  }

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete?.()
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Chấm Công — ${cls?.name ?? '—'}`}
      footer={
        <div className="flex items-center justify-between gap-2">
          {record && (
            <Button variant="danger" size="sm" onClick={handleDelete} className="flex items-center gap-1.5">
              <Trash2 size={14} />
              {confirmDelete ? 'Xác nhận xóa?' : 'Xóa chấm công'}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={onClose}>Hủy</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>Lưu</Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-navy-500">{formatDateLabel(date)}</p>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-navy-700">Trạng thái</label>
          <div className="flex flex-col gap-2">
            {ATTENDANCE_STATUSES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors text-left',
                  status === s.value
                    ? clsx(s.bg, s.border, s.text)
                    : 'bg-white border-navy-100 text-navy-600 hover:bg-navy-50'
                )}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-navy-700">Ghi chú (tùy chọn)</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="VD: Nghỉ bệnh, dạy thay cô A..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
