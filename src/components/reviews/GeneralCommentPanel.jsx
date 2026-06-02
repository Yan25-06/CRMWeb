import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Check } from 'lucide-react'
import { generalCommentService } from '@/services/generalCommentService'

/**
 * GeneralCommentPanel — free-form teacher comment per student-class.
 * Auto-saves with 800ms debounce. Shows "Đã lưu" indicator for 1.5s.
 * Props: studentId, classId, onSaved? — called after successful save so parent can sync
 */
export const GeneralCommentPanel = ({ studentId, classId, onSaved }) => {
  const [text,    setText]    = useState('')
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)
  const savedTimerRef = useRef(null)

  // Load comment whenever student/class changes
  useEffect(() => {
    if (!studentId || !classId) { setText(''); return }
    setLoading(true)
    generalCommentService.get(studentId, classId)
      .then(rec => setText(rec?.text ?? ''))
      .catch(() => {})
      .finally(() => setLoading(false))
    setSaved(false)
  }, [studentId, classId])

  const handleChange = (e) => {
    const val = e.target.value
    setText(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        await generalCommentService.upsert(studentId, classId, val)
        setSaved(true)
        onSaved?.()
        clearTimeout(savedTimerRef.current)
        savedTimerRef.current = setTimeout(() => setSaved(false), 1500)
      } catch {
        // silent — user sees no indicator, text still updated locally
      }
    }, 800)
  }

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
          disabled={loading}
          placeholder={loading ? 'Đang tải...' : 'Ghi nhận xét tổng kết về học viên này...'}
          rows={4}
          className="w-full text-sm text-navy-800 border border-navy-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-navy-300 placeholder:text-navy-300 disabled:opacity-50"
        />
      </div>
    </div>
  )
}
