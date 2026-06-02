import { MoreVertical, Calendar, Clock, GraduationCap, Users, Edit2, Trash2, UserCircle } from 'lucide-react'
import { Card } from '@/components/ui'
import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'

export const ClassCard = ({ cls, studentCount, onEdit, onDelete, showTeacher = false }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Map course types to badge colors
  const getBadgeColor = (type) => {
    const t = (type || '').toLowerCase()
    if (t.includes('ielts')) return 'bg-emerald-100 text-emerald-700'
    if (t.includes('toeic')) return 'bg-amber-100 text-amber-700'
    if (t.includes('giao tiếp')) return 'bg-blue-100 text-blue-700'
    if (t.includes('trẻ em')) return 'bg-purple-100 text-purple-700'
    return 'bg-navy-100 text-navy-700'
  }

  return (
    <Card className="flex flex-col relative transition-all hover:shadow-navy-md hover:-translate-y-1">
      {/* Top section */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <span className={clsx('px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider', getBadgeColor(cls.courseType))}>
            {cls.courseType || 'Lớp học'}
          </span>
          
          {/* Action Menu */}
          <div className="relative" ref={menuRef} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-navy-400 hover:text-navy-700 rounded-lg hover:bg-navy-50 transition-colors -mr-1"
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-navy-md border border-navy-100 z-10 py-1 animate-fade-in">
                <button 
                  onClick={() => { setMenuOpen(false); onEdit() }}
                  className="w-full text-left px-3 py-2 text-sm text-navy-700 hover:bg-navy-50 flex items-center gap-2"
                >
                  <Edit2 size={14} /> Sửa
                </button>
                {onDelete && (
                  <button
                    onClick={() => { setMenuOpen(false); onDelete() }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-display font-semibold text-navy-900">{cls.name}</h3>
          {cls.level && <p className="text-sm text-navy-500 mt-1">Trình độ: {cls.level}</p>}
        </div>

        <div className="flex flex-col gap-2 mt-2">
          {cls.scheduleDays && (
            <div className="flex items-center gap-2 text-sm text-navy-600">
              <Calendar size={14} className="text-navy-400" />
              <span>{cls.scheduleDays}</span>
            </div>
          )}
          {cls.scheduleTime && (
            <div className="flex items-center gap-2 text-sm text-navy-600">
              <Clock size={14} className="text-navy-400" />
              <span>{cls.scheduleTime}</span>
            </div>
          )}
          {showTeacher && cls.teacherName && (
            <div className="flex items-center gap-2 text-sm text-navy-500 mt-1">
              <UserCircle size={14} className="text-navy-400 shrink-0" />
              <span className="truncate">{cls.teacherName}</span>
            </div>
          )}
          {cls.startDate && (
            <div className="flex items-center gap-2 text-sm font-medium text-navy-700 mt-2 bg-navy-50 w-fit px-2.5 py-1 rounded-lg">
              <GraduationCap size={14} className="text-navy-500" />
              <span className="uppercase text-[11px] tracking-wide text-navy-600 mr-1">Khai giảng:</span>
              {cls.startDate}
            </div>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-navy-100 p-4 px-5 bg-navy-50/30 flex items-center justify-between group cursor-pointer hover:bg-navy-50/50 transition-colors rounded-b-2xl">
        <div className="flex items-center gap-2 text-navy-700 font-medium text-sm">
          <Users size={16} className="text-navy-500" />
          <span>{studentCount} <span className="font-normal text-navy-500 uppercase text-[11px] tracking-wider ml-0.5">học viên</span></span>
          {cls.maxStudents > 0 && <span className="text-navy-400 font-normal">/ {cls.maxStudents}</span>}
        </div>
      </div>
    </Card>
  )
}
