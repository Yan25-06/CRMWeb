import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Check } from 'lucide-react'
import { getGeneralComment, upsertGeneralComment } from '@/services/generalCommentService'

/**
 * GeneralCommentPanel — free-form teacher comment per student-class.
 * Auto-saves with 800ms debounce. Shows "Đã lưu" indicator for 1.5s.
 * Props: studentId, classId
 */
export const GeneralCommentPanel = ({ studentId, classId }) => {
  const [text,    setText]    = useState('')
  const [saved,   setSaved]   = useState(false)
  const timerRef = useRef(null)
  const savedTimerRef = useRef(null)

  useEffect(() => {
    setSaved(false)
    getGeneralComment(studentId, classId).then(rec => setText(rec?.text ?? ''))
  }, [studentId, classId])

  const handleChange = (e) => {
    const val = e.target.value
    setText(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      upsertGeneralComment(studentId, classId, val).then(() => {
        setSaved(true)
        clearTimeout(savedTimerRef.current)
        savedTimerRef.current = setTimeout(() => setSaved(false), 1500)
      })
    }, 800)
  }

  // Cleanup on unmount
  useEffect(() => () => {
    clearTimeout(timerRef.current)
    clearTimeout(savedTimerRef.current)
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-navy-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={15} className="text-navy-400" />
          <p className="text-sm font-semibold text-navy-800">Nhận xét chung của giáo viên</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium animate-fade-in">
            <Check size={12} />
            Đã lưu
          </span>
        )}
      </div>
      <div className="p-4">
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Ghi nhận xét tổng kết về học viên này..."
          rows={4}
          className="w-full text-sm text-navy-800 border border-navy-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy-300 placeholder:text-navy-300"
        />
      </div>
    </div>
  )
}
