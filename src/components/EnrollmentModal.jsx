import { useState, useEffect } from 'react'
import { X, User } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, Select } from '@/components/ui'
import { upsertEnrollment, getStudents, getEnrollmentsByClass } from '@/store/db'
import { toast as uiToast } from '@/components/ui'
import { getInitials } from '@/utils/helpers'

const STATUS_OPTIONS = [
  { value: 'active',  label: 'Đang học' },
  { value: 'paused',  label: 'Tạm ngưng' },
  { value: 'dropped', label: 'Đã nghỉ' },
]

export const EnrollmentModal = ({
  open,
  onClose,
  mode = 'add',   // 'add' | 'edit'
  classId,
  enrollment,     // existing enrollment (for edit mode)
  student,        // existing student (for edit mode)
  onSaved,        // callback after save
}) => {
  const [availableStudents, setAvailableStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [status, setStatus] = useState('active')
  const [goal, setGoal] = useState('')
  const [note, setNote] = useState('')
  const [confirmDrop, setConfirmDrop] = useState(false)
  const [pendingStatus, setPendingStatus] = useState(null)

  useEffect(() => {
    if (!open) return
    if (mode === 'add') {
      // Load students not yet enrolled in this class
      const allStudents = getStudents()
      const enrolled = getEnrollmentsByClass(classId).map(e => e.studentId)
      setAvailableStudents(allStudents.filter(s => !enrolled.includes(s.id)))
      setSelectedStudentId('')
      setGoal('')
      setNote('')
      setStatus('active')
    } else if (mode === 'edit' && enrollment) {
      setStatus(enrollment.status || 'active')
      setGoal(enrollment.goal || '')
      setNote(enrollment.note || '')
      setConfirmDrop(false)
      setPendingStatus(null)
    }
  }, [open, mode, classId, enrollment?.studentId])

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'dropped') {
      // Require confirm before setting
      setPendingStatus('dropped')
      setConfirmDrop(true)
      return
    }
    setStatus(newStatus)
  }

  const confirmDropHandler = () => {
    setStatus('dropped')
    setConfirmDrop(false)
    setPendingStatus(null)
  }

  const handleSubmit = () => {
    if (mode === 'add') {
      if (!selectedStudentId) return
      const now = new Date().toISOString()
      const entry = upsertEnrollment({
        studentId: selectedStudentId,
        classId,
        status: 'active',
        goal,
        note,
        enrolledAt: now,
      })
      uiToast.success('Đã thêm học viên vào lớp')
    } else {
      // Edit mode
      const now = new Date().toISOString()
      const updated = {
        ...enrollment,
        status,
        goal,
        note,
      }
      if (status === 'paused' && enrollment.status !== 'paused') {
        updated.pausedAt = now
        uiToast.info('Đã tạm ngưng học viên')
      } else if (status === 'dropped') {
        updated.droppedAt = now
        uiToast.info('Đã ghi nhận học viên đã nghỉ')
      } else if (status === 'active' && enrollment.status !== 'active') {
        updated.pausedAt = null
        updated.droppedAt = null
        uiToast.success('Học viên đã quay lại lớp')
      } else {
        uiToast.success('Đã cập nhật thông tin')
      }
      upsertEnrollment(updated)
    }
    onSaved?.()
    onClose?.()
  }

  if (!open) return null

  const filteredStudents = availableStudents.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  )

  return (
    <div
      className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-3xl shadow-navy-xl w-full max-w-md animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-navy-50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy-900">
            {mode === 'add' ? '+ Thêm học viên vào lớp' : 'Sửa thông tin học viên'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">

          {/* ── Mode Add: student selector ── */}
          {mode === 'add' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">
                Chọn học viên
              </label>
              {availableStudents.length === 0 ? (
                <p className="text-sm text-navy-400 text-center py-4">
                  Tất cả học viên đã được thêm vào lớp
                </p>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Tìm học viên..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="input text-sm"
                  />
                  <div className="border border-navy-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <p className="text-sm text-navy-400 text-center p-4">Không tìm thấy</p>
                    ) : (
                      filteredStudents.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedStudentId(s.id)}
                          className={clsx(
                            'w-full flex items-center gap-3 px-4 py-3 text-left border-b border-navy-50 last:border-0 transition-colors',
                            selectedStudentId === s.id
                              ? 'bg-navy-50 text-navy-800'
                              : 'hover:bg-navy-50/50 text-navy-700'
                          )}
                        >
                          <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-700 text-xs font-bold
                            flex items-center justify-center shrink-0">
                            {getInitials(s.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{s.name}</p>
                            <p className="text-xs text-navy-400">{s.phone || 'Chưa có SĐT'}</p>
                          </div>
                          {selectedStudentId === s.id && (
                            <div className="w-4 h-4 rounded-full bg-navy-800 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Mode Edit: student name (readonly) ── */}
          {mode === 'edit' && student && (
            <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-navy-800 text-white text-sm font-bold
                flex items-center justify-center shrink-0">
                {getInitials(student.name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-900">{student.name}</p>
                <p className="text-xs text-navy-400">{student.phone || 'Chưa có SĐT'}</p>
              </div>
            </div>
          )}

          {/* ── Status (edit only) ── */}
          {mode === 'edit' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">
                Trạng thái
              </label>
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
          )}

          {/* ── Mục tiêu ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">
              Mục tiêu
            </label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="VD: Đạt 7.0 IELTS để du học..."
              rows={2}
              className="input resize-none text-sm"
            />
          </div>

          {/* ── Ghi chú nội bộ ── */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">
              Ghi chú nội bộ
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú dành riêng cho GV..."
              rows={2}
              className="input resize-none text-sm"
            />
          </div>

          {/* ── Confirm drop dialog ── */}
          {confirmDrop && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-sm text-amber-800 font-medium">
                Học viên này sẽ không nhận bài tập mới. Tiếp tục?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={confirmDropHandler}
                  className="flex-1"
                >
                  Xác nhận cho nghỉ
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { setConfirmDrop(false); setPendingStatus(null) }}
                  className="flex-1"
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-navy-50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={mode === 'add' && !selectedStudentId}
          >
            {mode === 'add' ? 'Thêm vào lớp' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  )
}
