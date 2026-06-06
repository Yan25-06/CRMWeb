import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, toast } from '@/components/ui'
import { studentService } from '@/services/studentService'
import { enrollmentService } from '@/services/enrollmentService'

const STATUS_OPTIONS = [
  { value: 'active',  label: 'Đang học'  },
  { value: 'paused',  label: 'Tạm ngưng' },
  { value: 'dropped', label: 'Đã nghỉ'   },
]

export const StudentEditModal = ({ open, onClose, student, enrollment, onSaved }) => {
  // Profile
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')
  const [grade, setGrade] = useState('')
  const [email, setEmail] = useState('')
  const [nameError, setNameError] = useState('')

  // Enrollment (chỉ dùng khi enrollment được truyền vào)
  const [status, setStatus]         = useState('active')
  const [feeType, setFeeType]       = useState('monthly')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [courseFee, setCourseFee]   = useState('')
  const [goal, setGoal]             = useState('')
  const [note, setNote]             = useState('')
  const [confirmDrop, setConfirmDrop] = useState(false)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !student) return
    setName(student.name || '')
    setPhone(student.phone || '')
    setGrade(student.grade || '')
    setEmail(student.email || '')
    setNameError('')

    if (enrollment) {
      setStatus(enrollment.status || 'active')
      setFeeType(enrollment.feeType || 'monthly')
      setMonthlyFee(enrollment.monthlyFee != null ? String(enrollment.monthlyFee) : '')
      setCourseFee(enrollment.courseFee != null ? String(enrollment.courseFee) : '')
      setGoal(enrollment.goal || '')
      setNote(enrollment.note || '')
      setConfirmDrop(false)
    }
  }, [open, student?.id, enrollment?.id])

  const handleStatusChange = (val) => {
    if (val === 'dropped') { setConfirmDrop(true); return }
    setStatus(val)
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setNameError('Họ và tên là bắt buộc'); return }
    setSaving(true)
    try {
      await studentService.update(student.id, {
        name: name.trim(), phone, grade, email: email || null,
      })

      if (enrollment) {
        const now = new Date().toISOString()
        const updated = {
          ...enrollment,
          status,
          feeType,
          monthlyFee: feeType === 'monthly' ? (Number(monthlyFee) || 0) : null,
          courseFee:  feeType === 'course'  ? (Number(courseFee)  || 0) : null,
          goal,
          note,
        }
        if (status === 'paused' && enrollment.status !== 'paused') {
          updated.pausedAt = now
        } else if (status === 'dropped') {
          updated.droppedAt = now
        } else if (status === 'active' && enrollment.status !== 'active') {
          updated.pausedAt = null
          updated.droppedAt = null
        }
        await enrollmentService.upsert(updated)
      }

      toast.success('Đã cập nhật thông tin')
      onSaved?.()
      onClose?.()
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-3xl shadow-navy-xl w-full max-w-md animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-navy-50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy-900">Sửa thông tin học viên</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 max-h-[72vh] overflow-y-auto">

          {/* ── Section 1: Hồ sơ ── */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Hồ sơ học viên</h3>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-navy-700">
                Họ và tên <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setNameError('') }}
                placeholder="Nhập họ và tên..."
                autoFocus
                className={clsx('input text-sm', nameError && 'border-red-400 ring-1 ring-red-200')}
              />
              {nameError && <p className="text-xs text-red-500">{nameError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-navy-700">Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="SĐT phụ huynh"
                  className="input text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-navy-700">Khối</label>
                <input
                  type="text"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  placeholder="VD: Lớp 5"
                  className="input text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-navy-700">Email (tùy chọn)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="input text-sm"
              />
            </div>
          </div>

          {/* ── Section 2: Ghi danh (chỉ khi có enrollment) ── */}
          {enrollment && (
            <>
              <div className="border-t border-navy-100" />

              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Thông tin ghi danh</h3>

                {/* Trạng thái */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-navy-700">Trạng thái</label>
                  <select
                    value={status}
                    onChange={e => handleStatusChange(e.target.value)}
                    className="select text-sm"
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Học phí */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-navy-700">Loại học phí</label>
                  <div className="flex gap-1 p-1 bg-navy-50 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFeeType('monthly')}
                      className={clsx(
                        'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
                        feeType === 'monthly' ? 'bg-white shadow-sm text-navy-800' : 'text-navy-500 hover:text-navy-700'
                      )}
                    >Theo tháng</button>
                    <button
                      type="button"
                      onClick={() => setFeeType('course')}
                      className={clsx(
                        'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
                        feeType === 'course' ? 'bg-white shadow-sm text-navy-800' : 'text-navy-500 hover:text-navy-700'
                      )}
                    >Theo khóa</button>
                  </div>
                  {feeType === 'monthly' ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-navy-700">Học phí tháng (VNĐ)</label>
                      <input
                        type="number"
                        value={monthlyFee}
                        onChange={e => setMonthlyFee(e.target.value)}
                        placeholder="VD: 800000"
                        min="0"
                        step="10000"
                        className="input text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-navy-700">Học phí cả khóa (VNĐ)</label>
                      <input
                        type="number"
                        value={courseFee}
                        onChange={e => setCourseFee(e.target.value)}
                        placeholder="VD: 3000000"
                        min="0"
                        step="100000"
                        className="input text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Mục tiêu */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-navy-700">Mục tiêu</label>
                  <textarea
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    placeholder="VD: Đạt 7.0 IELTS để du học..."
                    rows={2}
                    className="input resize-none text-sm"
                  />
                </div>

                {/* Ghi chú nội bộ */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-navy-700">Ghi chú nội bộ</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Ghi chú dành riêng cho GV..."
                    rows={2}
                    className="input resize-none text-sm"
                  />
                </div>

                {/* Xác nhận cho nghỉ */}
                {confirmDrop && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
                    <p className="text-sm text-amber-800 font-medium">
                      Học viên này sẽ không nhận bài tập mới. Tiếp tục?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => { setStatus('dropped'); setConfirmDrop(false) }}
                        className="flex-1"
                      >
                        Xác nhận cho nghỉ
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setConfirmDrop(false)}
                        className="flex-1"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-navy-50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  )
}
