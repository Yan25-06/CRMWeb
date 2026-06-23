import { useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { Clock, MapPin, Users } from 'lucide-react'
import { getAttendanceStatus } from './attendanceStatus'
import { fmtTime } from '@/utils/helpers'

// ─── Color Mapping by courseType ──────────────────────────
export const COURSE_COLORS = {
  'IELTS':     { bg: 'bg-navy-100',   border: 'border-navy-300',   text: 'text-navy-800',   dot: 'bg-navy-500'   },
  'TOEIC':     { bg: 'bg-teal-50',    border: 'border-teal-200',   text: 'text-teal-700',   dot: 'bg-teal-500'   },
  'Giao Tiếp': { bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  'default':   { bg: 'bg-gray-50',    border: 'border-gray-200',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
}

export const getCourseColor = (courseType) =>
  COURSE_COLORS[courseType] ?? COURSE_COLORS['default']

// ─── ScheduleCard ──────────────────────────────────────────
export const ScheduleCard = ({ item, cls, studentCount, showTeacher, onEdit, canCheckAttendance = false, attendanceRecord = null, onToggleAttendance, onAttendanceNote, teachers = [], onSetSubstitute }) => {
  const color = getCourseColor(cls?.courseType)

  // 2 trạng thái: mặc định "Đã dạy", chỉ 'absent' mới là Vắng (bản ghi cũ khác → coi như Đã dạy)
  const isAbsent = attendanceRecord?.status === 'absent'
  const att = getAttendanceStatus(isAbsent ? 'absent' : 'present')

  // Ghi chú ca dạy — chỉ hiện khi Vắng, debounce lưu
  const [noteVal, setNoteVal] = useState(attendanceRecord?.note ?? '')
  const noteTimer = useRef(null)
  useEffect(() => { setNoteVal(attendanceRecord?.note ?? '') }, [attendanceRecord?.note])

  const handleNote = (val) => {
    setNoteVal(val)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => onAttendanceNote?.(item, val), 400)
  }

  return (
    <div
      className={clsx(
        'group relative rounded-xl border p-2.5 cursor-pointer transition-all duration-150',
        'hover:shadow-md hover:-translate-y-0.5',
        color.bg, color.border,
        isAbsent && clsx('border-l-4', att.bar)
      )}
      onClick={() => onEdit?.(item)}
    >
      {/* Header: course dot + class name + always-visible attendance chip */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={clsx('w-2 h-2 rounded-full shrink-0', color.dot)} />
        <span className={clsx('text-xs font-semibold truncate', color.text)}>
          {cls?.name ?? '—'}
        </span>
        {canCheckAttendance && (
          <button
            className={clsx(
              'ml-auto shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
              att.bg, att.text, att.border, 'hover:opacity-80'
            )}
            title="Bấm để đổi Đã dạy / Vắng"
            onClick={(e) => { e.stopPropagation(); onToggleAttendance?.(item) }}
          >
            <span className={clsx('w-1.5 h-1.5 rounded-full', att.dot)} />
            {att.label}
          </button>
        )}
      </div>

      {/* Teacher name — only shown in admin "all teachers" view */}
      {showTeacher && cls?.teacherName && (
        <div className={clsx('text-xs mb-1 truncate opacity-70', color.text)}>
          {cls.teacherName}
        </div>
      )}

      {/* Time */}
      <div className={clsx('flex items-center gap-1 text-xs', color.text)}>
        <Clock size={11} className="shrink-0" />
        <span>{fmtTime(item.startTime)}–{fmtTime(item.endTime)}</span>
      </div>

      {/* Room */}
      {item.room && (
        <div className={clsx('flex items-center gap-1 text-xs mt-0.5', color.text, 'opacity-80')}>
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{item.room}</span>
        </div>
      )}

      {/* Student count */}
      {studentCount != null && (
        <div className={clsx('flex items-center gap-1 text-xs mt-0.5', color.text, 'opacity-70')}>
          <Users size={11} className="shrink-0" />
          <span>{studentCount} HV</span>
        </div>
      )}

      {/* Khi Vắng: chọn người dạy thay + ghi chú */}
      {canCheckAttendance && isAbsent && (
        <div className="mt-1.5 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
          <select
            value={attendanceRecord?.substituteTeacherId ?? ''}
            onChange={(e) => onSetSubstitute?.(item, e.target.value || null)}
            className="w-full text-xs px-2 py-1 rounded-lg border border-red-200 bg-white text-navy-700 focus:outline-none focus:ring-1 focus:ring-red-300"
          >
            <option value="">— Không có người dạy thay —</option>
            {teachers
              .filter(t => t.id !== cls?.teacherId)
              .map(t => (
                <option key={t.id} value={t.id}>Dạy thay: {t.name || t.email}</option>
              ))}
          </select>
          <input
            type="text"
            value={noteVal}
            onChange={(e) => handleNote(e.target.value)}
            placeholder="Ghi chú"
            className="w-full text-xs px-2 py-1 rounded-lg border border-red-200 bg-white text-navy-700 placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-red-300"
          />
        </div>
      )}
    </div>
  )
}
