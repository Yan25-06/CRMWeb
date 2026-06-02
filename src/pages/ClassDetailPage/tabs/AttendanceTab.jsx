import { useState, useEffect, useMemo } from 'react'
import { clsx } from 'clsx'
import { Trash2, FileText, Pencil } from 'lucide-react'
import { Button, Card, toast } from '@/components/ui'
import { SessionSelector } from '@/components/classes/SessionSelector'
import { SessionModal } from '@/components/classes/SessionModal'
import { AttendanceToggle } from '@/components/attendance/AttendanceToggle'
import { StudentAttendancePanel } from '@/components/attendance/StudentAttendancePanel'
import { getSessionsByClass } from '@/services/sessionService'
import { deleteSession } from '@/services/sessionService'
import { getAttendanceBySession, upsertAttendanceBySession } from '@/services/attendanceService'
import { getEnrollmentsByClass } from '@/services/enrollmentService'
import { getStudents } from '@/services/studentService'
import { getInitials } from '@/utils/helpers'

export const AttendanceTab = ({ classId }) => {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [students, setStudents] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [attendance, setAttendance] = useState([])
  const [attendanceRates, setAttendanceRates] = useState({})
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const loadClass = async () => {
    const [classSessions, allStudents, classEnrolls] = await Promise.all([
      getSessionsByClass(classId),
      getStudents(),
      getEnrollmentsByClass(classId),
    ])
    setSessions(classSessions)
    const activeEnrolls = classEnrolls.filter(e => e.status !== 'dropped')
    setEnrollments(activeEnrolls)
    const relevantStudents = allStudents.filter(s => activeEnrolls.some(e => e.studentId === s.id))
    setStudents(relevantStudents)
    if (!activeSessionId && classSessions.length > 0) {
      setActiveSessionId(classSessions[0].id)
    }
    // Compute attendance rates: present/total past sessions per student
    const today = new Date().toISOString().split('T')[0]
    const pastSessions = classSessions.filter(s => s.date <= today)
    if (pastSessions.length > 0) {
      const allAtts = await Promise.all(pastSessions.map(s => getAttendanceBySession(s.id)))
      const flatAtts = allAtts.flat()
      const rates = {}
      relevantStudents.forEach(student => {
        const studentAtts = flatAtts.filter(a => a.studentId === student.id)
        const presentCount = studentAtts.filter(a => a.present === true).length
        rates[student.id] = Math.round((presentCount / pastSessions.length) * 100)
      })
      setAttendanceRates(rates)
    }
  }

  useEffect(() => { loadClass() }, [classId])

  useEffect(() => {
    if (!activeSessionId) { setAttendance([]); return }
    getAttendanceBySession(activeSessionId).then(setAttendance)
  }, [activeSessionId])

  const handleSessionSaved = async (newId) => {
    const classSessions = await getSessionsByClass(classId)
    setSessions(classSessions)
    setActiveSessionId(newId)
  }

  const handleDeleteSession = async () => {
    if (!activeSessionId) return
    if (!window.confirm('Bạn có chắc chắn muốn xóa buổi học này không? Mọi dữ liệu điểm danh của buổi này sẽ bị xóa.')) return
    await deleteSession(activeSessionId)
    toast.success('Đã xóa buổi học')
    const classSessions = await getSessionsByClass(classId)
    setSessions(classSessions)
    setActiveSessionId(classSessions.length > 0 ? classSessions[0].id : '')
  }

  const handleEditSession = () => {
    const session = sessions.find(s => s.id === activeSessionId)
    if (session) setEditingSession(session)
  }

  const handleSessionUpdated = async () => {
    setSessions(await getSessionsByClass(classId))
  }

  const handleToggle = async (studentId, present) => {
    if (!activeSessionId) return
    await upsertAttendanceBySession(activeSessionId, studentId, present, undefined)
    setAttendance(await getAttendanceBySession(activeSessionId))
  }

  const handleNoteChange = async (studentId, note) => {
    if (!activeSessionId) return
    const att = attendance.find(a => a.studentId === studentId)
    if (!att && !note.trim()) return
    await upsertAttendanceBySession(activeSessionId, studentId, att ? att.present : null, note)
    setAttendance(await getAttendanceBySession(activeSessionId))
  }

  const presentCount = attendance.filter(a => a.present === true).length
  const totalActive = enrollments.filter(e => e.status === 'active').length

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-navy-100 shadow-navy-sm">
        <SessionSelector
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={setActiveSessionId}
          onAddNew={() => setSessionModalOpen(true)}
        />
        {activeSessionId && (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-navy-50 rounded-xl text-sm font-medium text-navy-800 border border-navy-100">
              Có mặt: <span className="text-emerald-600">{presentCount}</span> / {totalActive}
            </div>
            <button onClick={handleEditSession} className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors" title="Chỉnh sửa buổi này">
              <Pencil size={16} />
            </button>
            <button onClick={handleDeleteSession} className="p-1.5 text-navy-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa buổi này">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {!activeSessionId ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center gap-3">
          <FileText size={48} className="text-navy-200" />
          <p className="font-semibold text-navy-700">Chưa có buổi học nào</p>
          <p className="text-sm text-navy-400">Tạo buổi đầu tiên để bắt đầu điểm danh</p>
          <Button onClick={() => setSessionModalOpen(true)} className="mt-2">+ Tạo buổi học</Button>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
              <thead>
                <tr className="bg-navy-50/50 border-b border-navy-100">
                  <th className="px-6 py-4 font-semibold text-navy-800 w-1/4">Học viên</th>
                  <th className="px-6 py-4 font-semibold text-navy-800 w-1/4 text-center">Chuyên cần</th>
                  <th className="px-6 py-4 font-semibold text-navy-800 w-1/4 text-center">Điểm danh</th>
                  <th className="px-6 py-4 font-semibold text-navy-800 w-1/4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {students.map(student => {
                  const enroll = enrollments.find(e => e.studentId === student.id)
                  const isPaused = enroll?.status === 'paused'
                  const att = attendance.find(a => a.studentId === student.id)
                  const present = att ? att.present : null
                  const note = att ? att.note : ''
                  const rate = attendanceRates[student.id] ?? null

                  return (
                    <tr key={student.id} className={clsx('transition-colors hover:bg-navy-50/30', isPaused && 'opacity-50 bg-gray-50/50 hover:bg-gray-50/50')}>
                      <td className="px-6 py-3">
                        <button className="flex items-center gap-3 text-left w-full group" onClick={() => setSelectedStudent(student)}>
                          <div className="w-9 h-9 rounded-full bg-navy-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="font-medium text-navy-900 group-hover:text-navy-600 transition-colors">{student.name}</p>
                            {isPaused && <p className="text-xs text-amber-600 font-medium mt-0.5">Tạm ngưng</p>}
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={clsx('text-sm font-semibold',
                          isPaused ? 'text-navy-300' : rate === null ? 'text-navy-300' : rate >= 80 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {rate === null ? '—' : `${rate}%`}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <AttendanceToggle present={present} disabled={isPaused} onChange={(val) => handleToggle(student.id, val)} />
                      </td>
                      <td className="px-6 py-3">
                        {!isPaused && (
                          <input
                            type="text"
                            placeholder="Nhập ghi chú..."
                            className="input h-8 text-xs bg-navy-50/30 border-navy-100 focus:border-navy-300 focus:ring-navy-100 w-full max-w-xs"
                            value={note || ''}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          />
                        )}
                        {isPaused && <span className="text-xs text-navy-400 italic">Không áp dụng</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SessionModal open={sessionModalOpen} onClose={() => setSessionModalOpen(false)} classId={classId} onSaved={handleSessionSaved} />
      <SessionModal open={!!editingSession} onClose={() => setEditingSession(null)} classId={classId} session={editingSession} onSaved={handleSessionUpdated} />

      {selectedStudent && (
        <StudentAttendancePanel student={selectedStudent} classId={classId} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  )
}
