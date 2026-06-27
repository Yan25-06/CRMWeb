import { useState, useEffect } from 'react'
import { Modal, Button, toast } from '@/components/ui'
import { getInitials } from '@/utils/helpers'
import { enrollMany } from '@/utils/enrollMany'
import { BulkFeeFields } from './BulkFeeFields'

// Modal ghi danh nhiều học sinh vào 1 lớp (StudentsDirectoryPage).
// Props:
//   open, onClose
//   students: Array<{ id, name, phone }>
//   classes: Array<{ id, name }>
//   onSaved: () => void
export const BulkEnrollModal = ({ open, onClose, students = [], classes = [], onSaved }) => {
  const [classId, setClassId] = useState('')
  const [feeType, setFeeType] = useState('monthly')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [courseFee, setCourseFee] = useState('')
  const [goal, setGoal] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setClassId('')
      setFeeType('monthly')
      setMonthlyFee('')
      setCourseFee('')
      setGoal('')
      setNote('')
      setSaving(false)
    }
  }, [open])

  const selectedClass = classes.find(c => c.id === classId)

  const handleSubmit = async () => {
    if (students.length === 0 || !classId) return
    setSaving(true)
    try {
      const { ok, failed } = await enrollMany(
        students.map(s => s.id),
        classId,
        { feeType, monthlyFee, courseFee, goal, note }
      )
      if (ok > 0) toast.success(`Đã ghi danh ${ok} học sinh vào ${selectedClass?.name}`)
      if (failed.length > 0) toast.error(`${failed.length} học sinh ghi danh thất bại`)
      onSaved?.()
      onClose?.()
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const title = students.length === 1
    ? `Ghi danh: ${students[0].name}`
    : `Ghi danh ${students.length} học sinh`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={saving || students.length === 0 || !classId}>
            {saving ? 'Đang ghi danh...' : 'Ghi danh'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Student chips */}
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {students.map(s => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-navy-50 rounded-lg text-xs text-navy-700"
            >
              <span className="w-5 h-5 rounded-full bg-navy-800 text-white flex items-center justify-center text-[9px] font-bold">
                {getInitials(s.name)}
              </span>
              {s.name}
            </span>
          ))}
        </div>

        {/* Class picker */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-navy-700">Lớp học</label>
          <select
            value={classId}
            onChange={e => setClassId(e.target.value)}
            className="select py-2 text-sm"
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="border-t border-navy-100 pt-3 flex flex-col gap-3">
          <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide">Thông tin ghi danh</p>

          <BulkFeeFields
            feeType={feeType}
            setFeeType={setFeeType}
            monthlyFee={monthlyFee}
            setMonthlyFee={setMonthlyFee}
            courseFee={courseFee}
            setCourseFee={setCourseFee}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy-700">Mục tiêu</label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="VD: Đạt 7.0 IELTS để du học..."
              rows={2}
              className="input py-2 text-sm resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-navy-700">Ghi chú nội bộ</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú dành riêng cho GV..."
              rows={2}
              className="input py-2 text-sm resize-none"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
