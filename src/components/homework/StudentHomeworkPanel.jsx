import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { Badge, toast } from '@/components/ui'
import { sessionService } from '@/services/sessionService'
import { homeworkService } from '@/services/homeworkService'
import { enrollmentService } from '@/services/enrollmentService'
import { AttendanceRingChart } from '@/components/attendance/AttendanceRingChart'

export const StudentHomeworkPanel = ({ student, classId, onClose }) => {
  const [sessions, setSessions] = useState([])
  const [homeworks, setHomeworks] = useState([])
  const [enrolledDate, setEnrolledDate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student?.id) return
    setLoading(true)
    Promise.all([
      sessionService.getByClass(classId),
      homeworkService.getByStudent(student.id, classId),
      enrollmentService.get(student.id, classId),
    ])
      .then(([classSessions, hws, enrollment]) => {
        setSessions(classSessions)
        setHomeworks(hws)
        setEnrolledDate(enrollment?.enrolledAt ? enrollment.enrolledAt.split('T')[0] : null)
      })
      .catch(() => toast.error('Không thể tải dữ liệu bài tập'))
      .finally(() => setLoading(false))
  }, [student?.id, classId])

  const history = useMemo(() => {
    return sessions.map(session => {
      const hw = homeworks.find(h => h.sessionId === session.id)
      return { session, hw }
    })
  }, [sessions, homeworks])

  const relevantHistory = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return history.filter(h => {
      const isPast = h.session.date <= today
      const afterEnroll = !enrolledDate || h.session.date >= enrolledDate
      return isPast && afterEnroll
    })
  }, [history, enrolledDate])

  const totalCount = relevantHistory.length

  let doneCount = 0
  let inProgressCount = 0
  let notDoneCount = 0

  relevantHistory.forEach(h => {
    if (h.hw?.progress === 'done') doneCount++
    else if (h.hw?.progress === 'in_progress') inProgressCount++
    else notDoneCount++
  })

  const percent = totalCount > 0 ? Math.round((doneCount * 100 + inProgressCount * 50) / totalCount) : 0

  const formatDate = (isoStr) => {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (!student) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className={clsx(
          'bg-white shadow-navy-2xl rounded-2xl flex flex-col w-full max-w-xl max-h-[90vh] pointer-events-auto',
          'animate-scale-in'
        )}>
          <div className="px-6 py-4 border-b border-navy-50 flex items-center justify-between bg-white rounded-t-2xl">
            <h2 className="text-lg font-display font-bold text-navy-900">{student.name}</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-navy-400 text-sm">Đang tải...</div>
            ) : (
              <>
                <div className="bg-navy-50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
                  <AttendanceRingChart present={doneCount + (inProgressCount * 0.5)} total={totalCount} size={80} />
                  <div className="text-center">
                    <p className="font-semibold text-navy-800">Hiệu suất làm bài: {percent}%</p>
                    <p className="text-sm text-navy-500">
                      <span className="text-emerald-600 font-medium">{doneCount} hoàn tất</span> ·
                      <span className="text-amber-600 font-medium ml-1">{inProgressCount} chưa hoàn tất</span> ·
                      <span className="text-red-600 font-medium ml-1">{notDoneCount} không nộp</span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-navy-800 mb-3 uppercase tracking-wide">
                    Lịch sử bài tập
                  </h3>
                  <div className="border border-navy-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-navy-50/50 border-b border-navy-100">
                          <th className="px-4 py-2 font-medium text-navy-600">Buổi / Chủ đề</th>
                          <th className="px-4 py-2 font-medium text-navy-600 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-50">
                        {history.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="px-4 py-6 text-center text-navy-400">
                              Chưa có dữ liệu
                            </td>
                          </tr>
                        ) : (
                          history.map((h, i) => (
                            <tr key={h.session.id} className="hover:bg-navy-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium text-navy-800">
                                    Buổi {history.length - i} · {formatDate(h.session.date)}
                                  </span>
                                  {(h.session.topic || h.hw?.title) && (
                                    <span className="text-xs text-navy-500 line-clamp-1">
                                      {h.session.topic || h.hw?.title}
                                    </span>
                                  )}
                                  {h.hw?.note && (
                                    <span className="text-xs text-navy-400 line-clamp-1 italic mt-1">
                                      Ghi chú: {h.hw.note}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {h.hw?.progress === 'done' && <Badge variant="success">Hoàn tất</Badge>}
                                {h.hw?.progress === 'in_progress' && <Badge variant="warning">Chưa hoàn tất</Badge>}
                                {(!h.hw || h.hw.progress === 'not_done') && <Badge variant="danger">Không nộp</Badge>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
