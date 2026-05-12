import { useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { FileText, Plus } from 'lucide-react'
import { Button, Card, toast } from '@/components/ui'
import { SessionSelector } from '@/components/SessionSelector'
import { SessionModal } from '@/components/SessionModal'
import { ProgressBadge } from '@/components/ProgressBadge'
import { HomeworkNoteCell } from '@/components/HomeworkNoteCell'
import { HomeworkSummaryFooter } from '@/components/HomeworkSummaryFooter'
import { StudentHomeworkPanel } from '@/components/StudentHomeworkPanel'
import {
  getSessionsByClass, getStudents, getEnrollmentsByClass,
  getHomeworkBySession, updateHomework, updateSessionHomeworkTitle, saveHomeworks, getHomeworks, getHomeworkStats
} from '@/store/db'

const getInitials = (name = '') => {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

export const HomeworkTab = ({ classId }) => {
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [students, setStudents] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [records, setRecords] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  
  // For shared title input
  const [sharedTitle, setSharedTitle] = useState('')
  const titleTimerRef = useRef(null)

  useEffect(() => {
    const classSessions = getSessionsByClass(classId)
    setSessions(classSessions)
    if (!activeSessionId && classSessions.length > 0) {
      setActiveSessionId(classSessions[0].id)
    }
    
    const loadStudents = () => {
      const allStudents = getStudents()
      const classEnrolls = getEnrollmentsByClass(classId).filter(e => e.status !== 'dropped')
      const relevantStudents = allStudents.filter(s => classEnrolls.some(e => e.studentId === s.id))
      setStudents(relevantStudents)
      setEnrollments(classEnrolls)
    }
    loadStudents()
  }, [classId])

  useEffect(() => {
    if (activeSessionId) {
      const hwRecords = getHomeworkBySession(activeSessionId)
      setRecords(hwRecords)
      setSharedTitle(hwRecords.length > 0 ? hwRecords[0].title || '' : '')
    } else {
      setRecords([])
      setSharedTitle('')
    }
  }, [activeSessionId])

  const handleSessionSaved = (newId) => {
    const classSessions = getSessionsByClass(classId)
    setSessions(classSessions)
    setActiveSessionId(newId)
  }

  const handleProgressChange = (recordId, newProgress) => {
    updateHomework(recordId, { progress: newProgress })
    setRecords(getHomeworkBySession(activeSessionId))
    toast.success('Đã lưu tiến độ', { duration: 1500 }) // Mini toast equivalent
  }

  const handleNoteChange = (recordId, note) => {
    updateHomework(recordId, { note })
    setRecords(getHomeworkBySession(activeSessionId))
  }

  const handleTitleChange = (val) => {
    setSharedTitle(val)
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current)
    titleTimerRef.current = setTimeout(() => {
      if (activeSessionId) {
        updateSessionHomeworkTitle(activeSessionId, val)
        setRecords(getHomeworkBySession(activeSessionId))
      }
    }, 600)
  }

  const handleAddMissingRecord = (studentId) => {
    if (!activeSessionId) return
    const allHw = getHomeworks()
    const now = new Date().toISOString()
    const newRecord = {
      id: uid(),
      sessionId: activeSessionId,
      studentId,
      classId,
      progress: 0,
      title: sharedTitle,
      note: '',
      createdAt: now,
      updatedAt: now
    }
    allHw.push(newRecord)
    saveHomeworks(allHw)
    setRecords(getHomeworkBySession(activeSessionId))
  }

  return (
    <div className="flex flex-col gap-6 relative h-full min-h-[500px]">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-navy-100 shadow-navy-sm">
        <SessionSelector
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={setActiveSessionId}
          onAddNew={() => setSessionModalOpen(true)}
        />
        
        {activeSessionId && (
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Tên bài tập hôm nay..."
              className="input text-sm w-full"
              value={sharedTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      {!activeSessionId ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center gap-3">
          <FileText size={48} className="text-navy-200" />
          <p className="font-semibold text-navy-700">Chưa có buổi học nào</p>
          <p className="text-sm text-navy-400">Tạo buổi đầu tiên ở tab Điểm Danh hoặc thêm tại đây</p>
          <Button onClick={() => setSessionModalOpen(true)} className="mt-2">
            + Tạo buổi học
          </Button>
        </Card>
      ) : students.length === 0 ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center gap-3">
          <FileText size={48} className="text-navy-200" />
          <p className="font-semibold text-navy-700">Không có học viên nào</p>
          <p className="text-sm text-navy-400">Thêm học viên vào lớp để giao bài tập</p>
        </Card>
      ) : (
        <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-navy-50/50 border-b border-navy-100">
                  <th className="px-6 py-4 font-semibold text-navy-800 w-1/4">Học viên</th>
                  <th className="px-6 py-4 font-semibold text-navy-800 w-1/4 text-center">Hiệu suất</th>
                  <th className="px-6 py-4 font-semibold text-navy-800 w-1/4 text-center">Kết quả bài tập</th>
                  <th className="px-6 py-4 font-semibold text-navy-800 w-1/4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {students.map(student => {
                  const enroll = enrollments.find(e => e.studentId === student.id)
                  const isPaused = enroll?.status === 'paused'
                  const record = records.find(r => r.studentId === student.id)
                  const hwStats = getHomeworkStats(student.id, classId)
                  const hwRate = hwStats.total > 0 ? Math.round((hwStats.done * 100 + hwStats.inProgress * 50) / hwStats.total) : 0

                  return (
                    <tr 
                      key={student.id} 
                      className={clsx(
                        "transition-colors hover:bg-navy-50/30",
                        isPaused && "opacity-50 bg-gray-50/50 hover:bg-gray-50/50"
                      )}
                    >
                      <td className="px-6 py-3">
                        <button 
                          className="flex items-center gap-3 text-left w-full group"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <div className="w-9 h-9 rounded-full bg-navy-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="font-medium text-navy-900 group-hover:text-navy-600 transition-colors">
                              {student.name}
                            </p>
                            {isPaused && <p className="text-xs text-amber-600 font-medium mt-0.5">Tạm ngưng</p>}
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={clsx(
                          "text-sm font-semibold",
                          isPaused ? "text-navy-300" : hwRate >= 80 ? "text-emerald-600" : hwRate >= 50 ? "text-amber-600" : "text-red-600"
                        )}>
                          {hwStats.total > 0 ? `${hwRate}%` : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        {record ? (
                          <ProgressBadge
                            progress={record.progress}
                            disabled={isPaused}
                            onChange={(val) => handleProgressChange(record.id, val)}
                          />
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-navy-500"
                            onClick={() => handleAddMissingRecord(student.id)}
                          >
                            <Plus size={14} className="mr-1" /> Thêm
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {record ? (
                          <HomeworkNoteCell
                            note={record.note}
                            disabled={isPaused}
                            onSave={(note) => handleNoteChange(record.id, note)}
                          />
                        ) : (
                          <span className="text-xs text-navy-300 italic">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <HomeworkSummaryFooter records={records.filter(r => !enrollments.find(e => e.studentId === r.studentId)?.status.includes('paused'))} />
        </div>
      )}

      <SessionModal
        open={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        classId={classId}
        onSaved={handleSessionSaved}
      />

      {selectedStudent && (
        <StudentHomeworkPanel
          student={selectedStudent}
          classId={classId}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  )
}
