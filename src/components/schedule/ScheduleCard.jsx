import { clsx } from 'clsx'
import { Clock, MapPin, Users } from 'lucide-react'
import { getAttendanceStatus } from './attendanceStatus'

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
export const ScheduleCard = ({ item, cls, studentCount, showTeacher, onEdit, canCheckAttendance = false, attendanceRecord = null, onCheckIn }) => {
  const color = getCourseColor(cls?.courseType)
  const att = getAttendanceStatus(attendanceRecord?.status)

  return (
    <div
      className={clsx(
        'group relative rounded-xl border p-2.5 cursor-pointer transition-all duration-150',
        'hover:shadow-md hover:-translate-y-0.5',
        color.bg, color.border,
        att && clsx('border-l-4', att.bar)
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
            className="ml-auto shrink-0"
            title="Chấm công giáo viên"
            onClick={(e) => { e.stopPropagation(); onCheckIn?.(item) }}
          >
            {att ? (
              <span className={clsx(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold border',
                att.bg, att.text, att.border
              )}>
                <span className={clsx('w-1.5 h-1.5 rounded-full', att.dot)} />
                {att.label}
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-navy-600 bg-navy-50 border border-navy-200 hover:bg-navy-100 transition-colors">
                Chấm
              </span>
            )}
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
        <span>{item.startTime}–{item.endTime}</span>
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

      {/* Attendance note (status itself shown via stripe + chip) */}
      {attendanceRecord?.note && (
        <div className={clsx('text-xs mt-1.5 pt-1.5 border-t truncate', color.text, color.border, 'opacity-80')}>
          {attendanceRecord.note}
        </div>
      )}
    </div>
  )
}
