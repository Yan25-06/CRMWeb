import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { clsx } from 'clsx'
import { Modal, Button, toast } from '@/components/ui'
import { getInitials } from '@/utils/helpers'
import { studentService } from '@/services/studentService'
import { enrollMany } from '@/utils/enrollMany'
import { BulkFeeFields } from './BulkFeeFields'

// Modal chọn nhiều học sinh để ghi danh vào 1 lớp (ClassDetailPage).
// Props:
//   open, onClose
//   classId
//   currentEnrollments: Enrollment[]   // để loại học sinh đã có trong lớp
//   onSaved: () => void
export const BulkEnrollPickerModal = ({ open, onClose, classId, currentEnrollments = [], onSaved }) => {
  const [allStudents, setAllStudents] = useState([])
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [feeType, setFeeType] = useState('monthly')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [courseFee, setCourseFee] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setSearch('')
    setSelectedIds(new Set())
    setFeeType('monthly')
    setMonthlyFee('')
    setCourseFee('')
    setSaving(false)
    setLoading(true)
    studentService.getAll()
      .then(setAllStudents)
      .catch(err => toast.error('Không tải được học sinh: ' + err.message))
      .finally(() => setLoading(false))
  }, [open])

  const enrolledIds = useMemo(
    () => new Set(currentEnrollments.map(e => e.studentId)),
    [currentEnrollments]
  )

  // Chỉ học sinh chưa có trong lớp + khớp tìm kiếm
  const available = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allStudents
      .filter(s => !enrolledIds.has(s.id))
      .filter(s => !q || s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q)))
  }, [allStudents, enrolledIds, search])

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return
    setSaving(true)
    try {
      const { ok, failed } = await enrollMany(
        [...selectedIds],
        classId,
        { feeType, monthlyFee, courseFee }
      )
      if (ok > 0) toast.success(`Đã thêm ${ok} học viên vào lớp`)
      if (failed.length > 0) toast.error(`${failed.length} học sinh thất bại`)
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
      title="Thêm học viên vào lớp"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={saving || selectedIds.size === 0}>
            {saving ? 'Đang ghi danh...' : `Ghi danh ${selectedIds.size} học sinh`}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-8 py-2 text-sm w-full"
          />
        </div>

        {/* Student list */}
        <div className="max-h-60 overflow-y-auto border border-navy-100 rounded-xl divide-y divide-navy-50">
          {loading ? (
            <p className="text-sm text-navy-400 text-center py-8">Đang tải...</p>
          ) : available.length === 0 ? (
            <p className="text-sm text-navy-400 text-center py-8">
              {search ? `Không tìm thấy "${search}"` : 'Không còn học sinh nào để thêm'}
            </p>
          ) : (
            available.map(s => {
              const checked = selectedIds.has(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    checked ? 'bg-navy-50' : 'hover:bg-navy-50/50'
                  )}
                >
                  <span className={clsx(
                    'w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 text-white text-[11px]',
                    checked ? 'bg-navy-800 border-navy-800' : 'border-navy-300'
                  )}>
                    {checked && '✓'}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {getInitials(s.name)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-navy-900 truncate">{s.name}</span>
                    <span className="block text-xs text-navy-400 truncate">{s.phone || 'Chưa có SĐT'}</span>
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Selected count */}
        {selectedIds.size > 0 && (
          <p className="text-xs font-semibold text-navy-700">Đã chọn {selectedIds.size} học sinh</p>
        )}

        {/* Fee form */}
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
