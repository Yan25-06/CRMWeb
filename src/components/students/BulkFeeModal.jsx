import { useState, useEffect } from 'react'
import { Modal, Button, toast } from '@/components/ui'
import { getInitials } from '@/utils/helpers'
import { enrollMany } from '@/utils/enrollMany'
import { BulkFeeFields } from './BulkFeeFields'

// Bước đặt học phí + xác nhận ghi danh hàng loạt (StudentsDirectoryPage).
// Props:
//   open, onClose
//   classId, className
//   students: Array<{ id, name, phone }>
//   onSaved: () => void   // gọi sau khi ghi danh xong
export const BulkFeeModal = ({ open, onClose, classId, className, students = [], onSaved }) => {
  const [feeType, setFeeType] = useState('monthly')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [courseFee, setCourseFee] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFeeType('monthly')
      setMonthlyFee('')
      setCourseFee('')
      setSaving(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (students.length === 0) return
    setSaving(true)
    try {
      const { ok, failed } = await enrollMany(
        students.map(s => s.id),
        classId,
        { feeType, monthlyFee, courseFee }
      )
      if (ok > 0) toast.success(`Đã ghi danh ${ok} học sinh vào ${className}`)
      if (failed.length > 0) toast.error(`${failed.length} học sinh ghi danh thất bại`)
      onSaved?.()
      onClose?.()
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Ghi danh ${students.length} học sinh vào ${className}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={saving || students.length === 0}>
            {saving ? 'Đang ghi danh...' : `Ghi danh ${students.length} học sinh`}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
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
        <BulkFeeFields
          feeType={feeType}
          setFeeType={setFeeType}
          monthlyFee={monthlyFee}
          setMonthlyFee={setMonthlyFee}
          courseFee={courseFee}
          setCourseFee={setCourseFee}
        />
      </div>
    </Modal>
  )
}
