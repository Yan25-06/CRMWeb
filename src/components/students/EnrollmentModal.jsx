import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/components/ui'
import { toast as uiToast } from '@/components/ui'
import { getInitials } from '@/utils/helpers'
import { studentService } from '@/services/studentService'
import { enrollmentService } from '@/services/enrollmentService'
import { dateKeyToISO, toDateKey, todayKey } from '@/utils/attendance'
import { EnrolledDateField } from '@/components/students/EnrolledDateField'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Đang học' },
  { value: 'paused', label: 'Tạm ngưng' },
  { value: 'dropped', label: 'Đã nghỉ' },
]

const EMPTY_NEW = { name: '', phone: '', grade: '', email: '', note: '' }

const GOAL_PLACEHOLDER = 'VD: Đạt 7.0 IELTS để du học...'
const NOTE_PLACEHOLDER = 'Ghi chú dành riêng cho GV...'

// ─── Logic thuần ─────────────────────────────────────────────

// Luồng của chế độ "add":
//   'pickClass' — đã chọn sẵn học sinh, chưa có lớp → chọn lớp để ghi danh
//   'existing'  — có lớp → chọn học viên có sẵn
//   'new'       — tạo học viên mới (kèm ghi danh nếu có lớp)
const getAddFlow = (student, classId, addSubMode) => {
  if (student && !classId) return 'pickClass'
  return addSubMode === 'existing' ? 'existing' : 'new'
}

const getTitle = (mode, flow, student, classId) => {
  if (mode !== 'add') return 'Sửa thông tin học viên'
  if (flow === 'pickClass') return `Ghi danh: ${student.name}`
  return classId ? '+ Thêm học viên vào lớp' : 'Thêm học sinh mới'
}

const getSubmitLabel = (mode, flow, classId) => {
  if (mode !== 'add') return 'Lưu thay đổi'
  if (flow === 'pickClass') return 'Ghi danh'
  if (flow === 'existing') return 'Thêm vào lớp'
  return classId ? 'Tạo & Thêm vào lớp' : 'Thêm học sinh'
}

// Form "add" còn thiếu trường bắt buộc của luồng hiện tại
const isAddIncomplete = (flow, { enrollClassId, selectedStudentId, newName }) => {
  if (flow === 'pickClass') return !enrollClassId
  if (flow === 'existing') return !selectedStudentId
  return !newName.trim()
}

// Khối nào được hiển thị trong thân modal
const getSections = ({ mode, flow, student, classId, isAdmin }) => {
  const isAdd = mode === 'add'
  const isEdit = mode === 'edit'
  const addToClass = isAdd && !!classId
  return {
    pickClass: isAdd && flow === 'pickClass',
    modeTabs: addToClass && isAdmin,
    existingPicker: isAdd && flow === 'existing',
    newForm: isAdd && flow === 'new' && !student,
    editHeader: isEdit && !!student,
    statusField: isEdit,
    enrollFields: isEdit || addToClass,
    noteField: isEdit || (addToClass && flow === 'existing'),
  }
}

// Mốc thời gian + thông báo khi đổi trạng thái enrollment ở chế độ sửa
const getStatusChange = (prevStatus, status, now) => {
  if (status === 'paused' && prevStatus !== 'paused') {
    return { patch: { pausedAt: now }, notice: ['info', 'Đã tạm ngưng học viên'] }
  }
  if (status === 'dropped') {
    return { patch: { droppedAt: now }, notice: ['info', 'Đã ghi nhận học viên đã nghỉ'] }
  }
  if (status === 'active' && prevStatus !== 'active') {
    return { patch: { pausedAt: null, droppedAt: null }, notice: ['success', 'Học viên đã quay lại lớp'] }
  }
  return { patch: {}, notice: ['success', 'Đã cập nhật thông tin'] }
}

// ─── Component con ───────────────────────────────────────────

const StudentSummary = ({ student }) => (
  <div className="flex items-center gap-3 p-3 bg-navy-50 rounded-xl">
    <div className="w-9 h-9 rounded-full bg-navy-800 text-white text-sm font-bold flex items-center justify-center shrink-0">
      {getInitials(student.name)}
    </div>
    <div>
      <p className="text-sm font-semibold text-navy-900">{student.name}</p>
      <p className="text-xs text-navy-400">{student.phone || 'Chưa có SĐT'}</p>
    </div>
  </div>
)

const TextAreaField = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-navy-700">{label}</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="input resize-none text-sm"
    />
  </div>
)

const PickClassSection = ({
  student, classes, enrollClassId, onClassChange,
  enrolledDate, onDateChange, goal, onGoalChange, note, onNoteChange,
}) => (
  <>
    <StudentSummary student={student} />

    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-navy-700">Lớp học</label>
      <select
        value={enrollClassId}
        onChange={e => onClassChange(e.target.value)}
        className="select text-sm"
      >
        <option value="">-- Chọn lớp --</option>
        {classes.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>

    <div className="border-t border-navy-100" />

    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Thông tin ghi danh</h3>
      <EnrolledDateField value={enrolledDate} onChange={onDateChange} />
      <TextAreaField label="Mục tiêu" value={goal} onChange={onGoalChange} placeholder={GOAL_PLACEHOLDER} />
      <TextAreaField label="Ghi chú nội bộ" value={note} onChange={onNoteChange} placeholder={NOTE_PLACEHOLDER} />
    </div>
  </>
)

const ModeTab = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={clsx(
      'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
      active ? 'bg-white shadow-sm text-navy-800' : 'text-navy-500 hover:text-navy-700'
    )}
  >
    {children}
  </button>
)

const AddModeTabs = ({ addSubMode, onExisting, onNew }) => (
  <div className="flex gap-1 p-1 bg-navy-50 rounded-xl">
    <ModeTab active={addSubMode === 'existing'} onClick={onExisting}>Chọn học viên có sẵn</ModeTab>
    <ModeTab active={addSubMode === 'new'} onClick={onNew}>Tạo học viên mới</ModeTab>
  </div>
)

const StudentOption = ({ student, selected, onSelect }) => (
  <button
    onClick={() => onSelect(student.id)}
    className={clsx(
      'w-full flex items-center gap-3 px-4 py-3 text-left border-b border-navy-50 last:border-0 transition-colors',
      selected ? 'bg-navy-50 text-navy-800' : 'hover:bg-navy-50/50 text-navy-700'
    )}
  >
    <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-700 text-xs font-bold flex items-center justify-center shrink-0">
      {getInitials(student.name)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{student.name}</p>
      <p className="text-xs text-navy-400">{student.phone || 'Chưa có SĐT'}</p>
    </div>
    {selected && (
      <div className="w-4 h-4 rounded-full bg-navy-800 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
      </div>
    )}
  </button>
)

const ExistingStudentPicker = ({ students, search, onSearch, selectedId, onSelect }) => {
  if (students.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-navy-700">Chọn học viên</label>
        <p className="text-sm text-navy-400 text-center py-4">Tất cả học viên đã được thêm vào lớp</p>
      </div>
    )
  }
  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-navy-700">Chọn học viên</label>
      <input
        type="text"
        placeholder="Tìm học viên..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        className="input text-sm"
      />
      <div className="border border-navy-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
        {filtered.length === 0 && <p className="text-sm text-navy-400 text-center p-4">Không tìm thấy</p>}
        {filtered.map(s => (
          <StudentOption key={s.id} student={s} selected={selectedId === s.id} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

const NewStudentForm = ({ form, errors, onChange, classId }) => (
  <div className="flex flex-col gap-3">
    {classId && (
      <p className="text-xs text-navy-400">Tạo học viên mới và tự động thêm vào lớp này</p>
    )}

    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-navy-700">
        Họ và tên <span className="text-red-400 normal-case">*</span>
      </label>
      <input
        type="text"
        name="name"
        value={form.name}
        onChange={onChange}
        placeholder="Nhập họ và tên..."
        className={clsx('input text-sm', errors.name && 'border-red-400 ring-1 ring-red-200')}
        autoFocus
      />
      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-navy-700">Số điện thoại</label>
        <input
          type="text"
          name="phone"
          value={form.phone}
          onChange={onChange}
          placeholder="SĐT phụ huynh"
          className="input text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-navy-700">Khối</label>
        <input
          type="text"
          name="grade"
          value={form.grade}
          onChange={onChange}
          placeholder="VD: Lớp 5"
          className="input text-sm"
        />
      </div>
    </div>

    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-navy-700">Email (tùy chọn)</label>
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={onChange}
        placeholder="email@example.com"
        className="input text-sm"
      />
    </div>

    {classId && <div className="border-t border-navy-100 pt-1" />}
  </div>
)

const StatusField = ({ value, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-navy-700">Trạng thái</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="select text-sm">
      {STATUS_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
)

const ConfirmDropBox = ({ onConfirm, onCancel }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
    <p className="text-sm text-amber-800 font-medium">
      Học viên này sẽ không nhận bài tập mới. Tiếp tục?
    </p>
    <div className="flex gap-2">
      <Button size="sm" variant="danger" onClick={onConfirm} className="flex-1">
        Xác nhận cho nghỉ
      </Button>
      <Button size="sm" variant="secondary" onClick={onCancel} className="flex-1">
        Hủy
      </Button>
    </div>
  </div>
)

// ─── Modal ───────────────────────────────────────────────────

export const EnrollmentModal = ({
  open,
  onClose,
  mode = 'add',
  classId,
  enrollment,
  student = null,
  classes = [],
  onSaved,
  isAdmin = false,
}) => {
  const [addSubMode, setAddSubMode] = useState('existing')

  const [availableStudents, setAvailableStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [studentSearch, setStudentSearch] = useState('')

  const [newForm, setNewForm] = useState(EMPTY_NEW)
  const [newErrors, setNewErrors] = useState({})

  // for mode="add" + student (pre-selected) + no classId: pick a class to enroll into
  const [enrollClassId, setEnrollClassId] = useState('')

  const [status, setStatus] = useState('active')
  const [goal, setGoal] = useState('')
  const [note, setNote] = useState('')
  const [enrolledDate, setEnrolledDate] = useState(todayKey())
  const [confirmDrop, setConfirmDrop] = useState(false)
  const [saving, setSaving] = useState(false)

  const flow = getAddFlow(student, classId, addSubMode)

  useEffect(() => {
    if (!open) return

    const loadAvailableStudents = async () => {
      try {
        const [allStudents, classEnrollments] = await Promise.all([
          studentService.getAll(),
          enrollmentService.getByClass(classId),
        ])
        const enrolled = new Set(classEnrollments.map(e => e.studentId))
        setAvailableStudents(allStudents.filter(s => !enrolled.has(s.id)))
      } catch {
        setAvailableStudents([])
      }
    }

    const resetForAdd = () => {
      if (classId) loadAvailableStudents()
      setAddSubMode(classId ? 'existing' : 'new')
      setEnrollClassId('')
      setSelectedStudentId('')
      setStudentSearch('')
      setNewForm(EMPTY_NEW)
      setNewErrors({})
      setGoal('')
      setNote('')
      setEnrolledDate(todayKey())
      setStatus('active')
    }

    const resetForEdit = () => {
      setStatus(enrollment.status || 'active')
      setGoal(enrollment.goal || '')
      setNote(enrollment.note || '')
      setEnrolledDate(toDateKey(enrollment.enrolledAt) || todayKey())
      setConfirmDrop(false)
    }

    if (mode === 'add') resetForAdd()
    else if (mode === 'edit' && enrollment) resetForEdit()
  }, [open, mode, classId, enrollment?.studentId])

  const handleStatusChange = (val) => {
    if (val === 'dropped') { setConfirmDrop(true); return }
    setStatus(val)
  }

  const confirmDropHandler = () => {
    setStatus('dropped'); setConfirmDrop(false)
  }

  const handleNewFormChange = (e) => {
    const { name, value } = e.target
    setNewForm(prev => ({ ...prev, [name]: value }))
    if (newErrors[name]) setNewErrors(prev => ({ ...prev, [name]: null }))
  }

  const validateNew = () => {
    const errs = {}
    if (!newForm.name.trim()) errs.name = 'Họ và tên là bắt buộc'
    setNewErrors(errs)
    return Object.keys(errs).length === 0
  }

  const enroll = (studentId, targetClassId, enrollNote) =>
    enrollmentService.upsert({
      studentId,
      classId: targetClassId,
      status: 'active',
      goal,
      note: enrollNote,
      enrolledAt: dateKeyToISO(enrolledDate),
    })

  // Mỗi hàm submit trả `true` khi đã lưu xong, `false` khi form chưa hợp lệ.
  const createNewStudent = async () => {
    if (!validateNew()) return false
    const created = await studentService.create({
      name: newForm.name.trim(),
      phone: newForm.phone.trim(),
      grade: newForm.grade.trim(),
      email: newForm.email.trim() || null,
    })
    if (!classId) {
      uiToast.success(`Đã thêm học sinh "${created.name}"`)
      return true
    }
    await enroll(created.id, classId, '')
    uiToast.success(`Đã tạo và thêm "${created.name}" vào lớp`)
    return true
  }

  const submitAdd = async () => {
    if (flow === 'pickClass') {
      if (!enrollClassId) return false
      await enroll(student.id, enrollClassId, note)
      uiToast.success('Đã ghi danh vào lớp!')
      return true
    }
    if (flow === 'existing') {
      if (!selectedStudentId) return false
      await enroll(selectedStudentId, classId, note)
      uiToast.success('Đã thêm học viên vào lớp')
      return true
    }
    return createNewStudent()
  }

  const submitEdit = async () => {
    const { patch, notice } = getStatusChange(enrollment.status, status, new Date().toISOString())
    const updated = { ...enrollment, status, goal, note, ...patch }
    // Chỉ ghi lại enrolled_at khi người dùng thực sự đổi ngày (giữ giờ gốc)
    if (enrolledDate && enrolledDate !== toDateKey(enrollment.enrolledAt)) {
      updated.enrolledAt = dateKeyToISO(enrolledDate)
    }
    await enrollmentService.upsert(updated)
    const [kind, message] = notice
    uiToast[kind](message)
    return true
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const done = mode === 'add' ? await submitAdd() : await submitEdit()
      if (!done) return
      onSaved?.()
      onClose?.()
    } catch (err) {
      uiToast.error('Lỗi: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const sections = getSections({ mode, flow, student, classId, isAdmin })
  const submitDisabled = saving || !enrolledDate || (mode === 'add' && isAddIncomplete(flow, {
    enrollClassId, selectedStudentId, newName: newForm.name,
  }))

  return (
    <div
      className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-3xl shadow-navy-xl w-full max-w-md animate-slide-up overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-navy-50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy-900">
            {getTitle(mode, flow, student, classId)}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 flex flex-col gap-4 max-h-[72vh] overflow-y-auto">

          {sections.pickClass && (
            <PickClassSection
              student={student}
              classes={classes}
              enrollClassId={enrollClassId}
              onClassChange={setEnrollClassId}
              enrolledDate={enrolledDate}
              onDateChange={setEnrolledDate}
              goal={goal}
              onGoalChange={setGoal}
              note={note}
              onNoteChange={setNote}
            />
          )}

          {sections.modeTabs && (
            <AddModeTabs
              addSubMode={addSubMode}
              onExisting={() => { setAddSubMode('existing'); setNewErrors({}) }}
              onNew={() => setAddSubMode('new')}
            />
          )}

          {sections.existingPicker && (
            <ExistingStudentPicker
              students={availableStudents}
              search={studentSearch}
              onSearch={setStudentSearch}
              selectedId={selectedStudentId}
              onSelect={setSelectedStudentId}
            />
          )}

          {sections.newForm && (
            <NewStudentForm
              form={newForm}
              errors={newErrors}
              onChange={handleNewFormChange}
              classId={classId}
            />
          )}

          {sections.editHeader && <StudentSummary student={student} />}

          {sections.statusField && <StatusField value={status} onChange={handleStatusChange} />}

          {sections.enrollFields && (
            <>
              <EnrolledDateField value={enrolledDate} onChange={setEnrolledDate} />
              <TextAreaField label="Mục tiêu" value={goal} onChange={setGoal} placeholder={GOAL_PLACEHOLDER} />
            </>
          )}

          {sections.noteField && (
            <TextAreaField label="Ghi chú nội bộ" value={note} onChange={setNote} placeholder={NOTE_PLACEHOLDER} />
          )}

          {confirmDrop && (
            <ConfirmDropBox onConfirm={confirmDropHandler} onCancel={() => setConfirmDrop(false)} />
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-navy-50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitDisabled}>
            {saving ? 'Đang lưu...' : getSubmitLabel(mode, flow, classId)}
          </Button>
        </div>
      </div>
    </div>
  )
}
