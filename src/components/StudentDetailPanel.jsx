import { useState, useEffect, useRef } from 'react'
import {
  Edit2, Target, Calendar, BookOpen, ClipboardList, BarChart2,
  Clock, ChevronDown, ChevronUp, CheckCircle
} from 'lucide-react'
import { clsx } from 'clsx'
import { Badge, Button, Skeleton } from '@/components/ui'
import {
  getSessionReviewsByStudent, addSessionReview, upsertEnrollment,
  getAttendanceRate, getSessionsByClass, getAttendanceByStudent
} from '@/store/db'

const STATUS_CONFIG = {
  active:  { label: 'Đang học',  variant: 'success', next: 'paused'  },
  paused:  { label: 'Tạm ngưng', variant: 'warning', next: 'dropped' },
  dropped: { label: 'Đã nghỉ',   variant: 'gray',    next: 'active'  },
}

const getInitials = (name = '') => {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDateShort = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

// ─── Quick Remark Input ──────────────────────────────────
const QuickRemarkInput = ({ student, enrollment, onRefresh }) => {
  const [remarks, setRemarks] = useState([])
  const [text, setText] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef(null)

  const load = () => {
    if (!student || !enrollment) return
    const all = getSessionReviewsByStudent(student.id, enrollment.classId)
    setRemarks(all)
  }

  useEffect(() => { load() }, [student?.id, enrollment?.classId])

  const handleSave = () => {
    if (!text.trim()) return
    setSaving(true)
    addSessionReview({ studentId: student.id, classId: enrollment.classId, text: text.trim() })
    setText('')
    load()
    setSaving(false)
  }

  const recent = remarks.slice(0, 3)
  const rest   = remarks.slice(3)

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Nhận xét GV</h3>

      {remarks.length === 0 && (
        <p className="text-sm text-navy-300 italic">Chưa có nhận xét nào</p>
      )}

      {/* Recent remarks */}
      {recent.map(r => (
        <div key={r.id} className="flex items-start gap-2 text-sm">
          <span className="text-navy-300 text-xs font-medium shrink-0 pt-0.5 w-12">{formatDateShort(r.createdAt)}</span>
          <span className="text-navy-700 truncate">{r.text}</span>
        </div>
      ))}

      {/* Expand rest */}
      {rest.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(x => !x)}
            className="flex items-center gap-1 text-xs text-navy-400 hover:text-navy-700 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Ẩn bớt' : `Xem tất cả (${remarks.length})`}
          </button>
          {expanded && (
            <div className="flex flex-col gap-2 border-t border-navy-50 pt-2">
              {rest.map(r => (
                <div key={r.id} className="flex items-start gap-2 text-sm">
                  <span className="text-navy-300 text-xs font-medium shrink-0 pt-0.5 w-12">{formatDateShort(r.createdAt)}</span>
                  <span className="text-navy-700">{r.text}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add remark */}
      <div className="flex flex-col gap-2 mt-1">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSave() }}
          placeholder="Thêm nhận xét..."
          rows={2}
          className="input resize-none text-sm"
        />
        {text.trim() && (
          <Button size="sm" onClick={handleSave} disabled={saving} className="self-end">
            <CheckCircle size={14} /> Lưu
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export const StudentDetailPanel = ({ student, enrollment, onEdit, onStatusChange }) => {
  // Inline goal editing (task 6.3)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalText, setGoalText] = useState(enrollment?.goal || '')
  const goalInputRef = useRef(null)

  useEffect(() => {
    setGoalText(enrollment?.goal || '')
    setEditingGoal(false)
  }, [student?.id, enrollment])

  useEffect(() => {
    if (editingGoal) goalInputRef.current?.focus()
  }, [editingGoal])

  const handleSaveGoal = () => {
    if (!enrollment) return
    upsertEnrollment({ ...enrollment, goal: goalText })
    setEditingGoal(false)
    onStatusChange?.()
  }

  if (!student || !enrollment) {
    return (
      <div className="flex flex-col gap-4 animate-pulse p-6">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const cfg   = STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.active
  const initials = getInitials(student.name)
  
  const attendanceRate = getAttendanceRate(student.id, enrollment.classId)
  
  // Calculate attendance history for timeline
  const classSessions = getSessionsByClass(enrollment.classId)
  const studentAtts = getAttendanceByStudent(student.id).filter(a => a.classId === enrollment.classId)
  
  const recentAttendance = classSessions
    .filter(s => s.date <= new Date().toISOString().split('T')[0])
    .map(s => {
      const att = studentAtts.find(a => a.sessionId === s.id)
      return {
        id: s.id,
        type: 'attendance',
        date: s.date,
        present: att ? att.present : null,
        topic: s.topic
      }
    })
    .filter(a => a.present !== null)
    .slice(0, 5)

  const handleStatusClick = () => {
    // Cycle: active → paused (needs confirm handled in parent / EnrollmentModal)
    // For inline click-to-change: active ↔ active, show modal
    onEdit?.()
  }

  return (
    <div className="flex flex-col gap-6 overflow-y-auto h-full">
      {/* ── Header section (3.3) ── */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-5">
        <div className="flex items-start gap-4">
          {/* Large avatar */}
          <div className="w-14 h-14 rounded-full bg-navy-800 text-white font-bold text-xl
            flex items-center justify-center shrink-0 select-none shadow-navy">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-display text-navy-900 leading-tight">{student.name}</h2>
                <p className="text-sm text-navy-400 mt-0.5">{student.phone || 'Chưa có SĐT'}</p>
              </div>
              <button
                id="edit-enrollment-btn"
                onClick={onEdit}
                className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors shrink-0"
                title="Sửa thông tin"
              >
                <Edit2 size={15} />
              </button>
            </div>

            {/* Badge trạng thái - click to change via modal */}
            <div className="flex items-center gap-2 mt-2">
              <button
                id="status-badge-btn"
                onClick={handleStatusClick}
                title="Bấm để thay đổi trạng thái"
                className="hover:scale-105 transition-transform"
              >
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </button>
              <span className="text-xs text-navy-300">· Tham gia {formatDate(enrollment.enrolledAt)}</span>
            </div>

            {/* Mục tiêu inline edit (6.3) */}
            <div className="flex items-start gap-1.5 mt-3">
              <Target size={13} className="text-navy-400 shrink-0 mt-0.5" />
              {editingGoal ? (
                <div className="flex-1 flex gap-2">
                  <input
                    ref={goalInputRef}
                    value={goalText}
                    onChange={e => setGoalText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveGoal()
                      if (e.key === 'Escape') setEditingGoal(false)
                    }}
                    onBlur={handleSaveGoal}
                    className="flex-1 text-sm border border-navy-300 rounded-lg px-2 py-0.5
                      focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-100"
                  />
                </div>
              ) : (
                <span
                  id="goal-text"
                  className="text-sm text-navy-600 cursor-pointer hover:text-navy-800 hover:underline decoration-dashed"
                  onClick={() => setEditingGoal(true)}
                  title="Bấm để sửa mục tiêu"
                >
                  {goalText || <em className="text-navy-300">Chưa có mục tiêu — bấm để thêm</em>}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 Overview cards (3.4) — 2×2 grid ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-1">
            <BookOpen size={13} className="text-navy-400" />
            <span className="text-xs text-navy-400 font-medium uppercase tracking-wide">Điểm danh</span>
          </div>
          <span className="text-2xl font-display text-navy-900 leading-none">{attendanceRate}%</span>
          <span className="text-xs text-navy-400">chuyên cần</span>
        </div>

        <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-1">
            <ClipboardList size={13} className="text-navy-400" />
            <span className="text-xs text-navy-400 font-medium uppercase tracking-wide">Bài tập</span>
          </div>
          <span className="text-2xl font-display text-navy-900 leading-none">—/—</span>
          <span className="text-xs text-navy-400">bài · Phase C</span>
        </div>

        <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart2 size={13} className="text-navy-400" />
            <span className="text-xs text-navy-400 font-medium uppercase tracking-wide">Mock Test</span>
          </div>
          <span className="text-sm font-medium text-navy-400 mt-1">Chưa có</span>
          <span className="text-xs text-navy-300">Phase D</span>
        </div>

        <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar size={13} className="text-navy-400" />
            <span className="text-xs text-navy-400 font-medium uppercase tracking-wide">Buổi tiếp theo</span>
          </div>
          <span className="text-sm font-medium text-navy-600">Xem lịch</span>
          <span className="text-xs text-navy-300">từ Schedule</span>
        </div>
      </div>

      {/* ── Nhận xét GV (3.5) ── */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-5">
        <QuickRemarkInput student={student} enrollment={enrollment} onRefresh={() => {}} />
      </div>

      {/* ── Timeline 5 hoạt động gần nhất (3.6) ── */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-5">
        <h3 className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-3">
          Hoạt động gần đây
        </h3>
        <div className="flex flex-col gap-3">
          {/* Enrollment event */}
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            <div>
              <p className="text-sm text-navy-700">Tham gia lớp</p>
              <p className="text-xs text-navy-400">{formatDate(enrollment.enrolledAt)}</p>
            </div>
          </div>
          {enrollment.pausedAt && (
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm text-navy-700">Tạm ngưng học</p>
                <p className="text-xs text-navy-400">{formatDate(enrollment.pausedAt)}</p>
              </div>
            </div>
          )}
          {enrollment.droppedAt && (
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm text-navy-700">Đã nghỉ học</p>
                <p className="text-xs text-navy-400">{formatDate(enrollment.droppedAt)}</p>
              </div>
            </div>
          )}

          {/* Attendance events */}
          {recentAttendance.map(event => (
            <div key={event.id} className="flex items-start gap-3">
              <div className={clsx(
                "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                event.present ? "bg-emerald-400" : "bg-red-400"
              )} />
              <div>
                <p className="text-sm text-navy-700">
                  {event.present ? "Có mặt" : "Vắng mặt"} 
                  {event.topic && <span className="text-navy-400 font-normal"> — {event.topic}</span>}
                </p>
                <p className="text-xs text-navy-400">{formatDate(event.date)}</p>
              </div>
            </div>
          ))}

          {recentAttendance.length === 0 && (
            <div className="flex items-start gap-3 opacity-50">
              <div className="w-1.5 h-1.5 rounded-full bg-navy-200 mt-1.5 shrink-0" />
              <p className="text-xs text-navy-400 italic">
                Chưa có dữ liệu điểm danh
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-4" />
    </div>
  )
}
