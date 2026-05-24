import { useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { FileText, Plus, ArrowLeft, ClipboardList, Calendar } from 'lucide-react'
import { Button, Card, Badge, toast } from '@/components/ui'
import { SessionSelector } from '@/components/SessionSelector'
import { SessionModal } from '@/components/SessionModal'
import { ProgressBadge } from '@/components/ProgressBadge'
import { HomeworkNoteCell } from '@/components/HomeworkNoteCell'
import { HomeworkSummaryFooter } from '@/components/HomeworkSummaryFooter'
import { StudentHomeworkPanel } from '@/components/StudentHomeworkPanel'
import { HomeworkAssignmentModal } from '@/components/homework/HomeworkAssignmentModal'
import { SubmissionTable } from '@/components/homework/SubmissionTable'
import {
  getSessionsByClass, getStudents, getEnrollmentsByClass,
  getHomeworkBySession, updateHomework, updateSessionHomeworkTitle, saveHomeworks, getHomeworks, getHomeworkStats,
  getHwAssignmentsByClass, createHwAssignment, deleteHwAssignment,
  getSubmissionsByAssignment, getActiveStudents,
  uid
} from '@/store/db'
import { getInitials, fmtDate } from '@/utils/helpers'

const MODE = { SESSION: 'session', ASSIGN: 'assign' }

export const HomeworkTab = ({ classId }) => {
  const [mode, setMode] = useState(MODE.SESSION)
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
      progress: 'not_done',
      title: sharedTitle,
      note: '',
      createdAt: now,
      updatedAt: now
    }
    allHw.push(newRecord)
    saveHomeworks(allHw)
    setRecords(getHomeworkBySession(activeSessionId))
  }

  if (mode === MODE.ASSIGN) {
    return <AssignView classId={classId} onBack={() => setMode(MODE.SESSION)} />
  }

  return (
    <div className="flex flex-col gap-6 relative h-full min-h-[500px]">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode(MODE.SESSION)}
          className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            mode === MODE.SESSION ? 'bg-navy-800 text-white' : 'text-navy-500 hover:bg-navy-50')}
        >
          <Calendar size={14} /> Theo Buổi
        </button>
        <button
          onClick={() => setMode(MODE.ASSIGN)}
          className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            mode === MODE.ASSIGN ? 'bg-navy-800 text-white' : 'text-navy-500 hover:bg-navy-50')}
        >
          <ClipboardList size={14} /> Bài Giao
        </button>
      </div>

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
          
          <HomeworkSummaryFooter records={records.filter(r => enrollments.find(e => e.studentId === r.studentId)?.status !== 'paused')} />
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

// ─── Bài Giao view ─────────────────────────────────────────
const AssignView = ({ classId, onBack }) => {
  const [assignments, setAssignments] = useState([])
  const [selected, setSelected] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [students, setStudents] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

  const refresh = () => {
    setAssignments(getHwAssignmentsByClass(classId))
    setStudents(getActiveStudents(classId))
  }

  useEffect(() => { refresh() }, [classId])

  const openAssignment = (a) => {
    setSelected(a)
    setSubmissions(getSubmissionsByAssignment(a.id))
  }

  const handleSave = (data) => {
    createHwAssignment({ ...data, classId })
    toast.success('Đã thêm bài tập!')
    refresh()
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (!confirm('Xóa bài tập này? Tất cả dữ liệu nộp bài sẽ bị xóa.')) return
    deleteHwAssignment(id)
    if (selected?.id === id) setSelected(null)
    refresh()
    toast.success('Đã xóa bài tập')
  }

  const refreshSubmissions = () => {
    if (selected) setSubmissions(getSubmissionsByAssignment(selected.id))
  }

  const submittedCount = submissions.filter(s => s.submitted).length
  const avgScore = (() => {
    const scored = submissions.filter(s => s.score != null)
    if (!scored.length) return null
    return (scored.reduce((a, s) => a + s.score, 0) / scored.length).toFixed(1)
  })()

  const isOverdue = (a) => a.dueDate && a.dueDate < new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Back + header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h3 className="font-semibold text-navy-800">
            {selected ? selected.title : 'Bài Giao'}
          </h3>
        </div>
        {!selected && (
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} className="mr-1" /> Thêm bài tập
          </Button>
        )}
        {selected && (
          <Button size="sm" variant="secondary" onClick={() => setSelected(null)}>
            <ArrowLeft size={14} className="mr-1" /> Danh sách
          </Button>
        )}
      </div>

      {/* View A: list */}
      {!selected && (
        assignments.length === 0 ? (
          <Card className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <ClipboardList size={40} className="text-navy-200" />
            <p className="font-semibold text-navy-700">Chưa có bài tập nào</p>
            <Button size="sm" onClick={() => setModalOpen(true)}>+ Thêm bài tập</Button>
          </Card>
        ) : (
          <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm overflow-hidden">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="bg-navy-50/60 border-b border-navy-100">
                  <th className="px-5 py-3 font-semibold text-navy-700">Bài tập</th>
                  <th className="px-5 py-3 font-semibold text-navy-700">Ngày giao</th>
                  <th className="px-5 py-3 font-semibold text-navy-700">Hạn nộp</th>
                  <th className="px-5 py-3 font-semibold text-navy-700 text-center">Nộp</th>
                  <th className="px-5 py-3 font-semibold text-navy-700 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {assignments.map(a => {
                  const subs = getSubmissionsByAssignment(a.id)
                  const cnt = subs.filter(s => s.submitted).length
                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-navy-50/40 cursor-pointer transition-colors"
                      onClick={() => openAssignment(a)}
                    >
                      <td className="px-5 py-3 font-medium text-navy-900">{a.title}</td>
                      <td className="px-5 py-3 text-navy-500">{fmtDate(a.assignedAt)}</td>
                      <td className="px-5 py-3">
                        {a.dueDate
                          ? <span className={clsx('text-sm', isOverdue(a) ? 'text-red-500 font-medium' : 'text-navy-500')}>
                              {fmtDate(a.dueDate)}
                              {isOverdue(a) && ' (quá hạn)'}
                            </span>
                          : <span className="text-navy-300">—</span>
                        }
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={cnt === students.length && students.length > 0 ? 'success' : cnt > 0 ? 'warning' : 'gray'}>
                          {cnt}/{students.length}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(a.id) }}
                          className="p-1 rounded text-navy-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* View B: submission table */}
      {selected && (
        <>
          {selected.description && (
            <p className="text-sm text-navy-500 bg-navy-50 rounded-xl px-4 py-2">{selected.description}</p>
          )}
          <SubmissionTable
            students={students}
            submissions={submissions}
            hwAssignmentId={selected.id}
            onUpdate={refreshSubmissions}
          />
          {/* Footer summary */}
          <div className="bg-navy-50 border border-navy-100 rounded-2xl px-5 py-3 flex items-center gap-6 text-sm">
            <span className="text-navy-700">
              Đã nộp <strong className="text-navy-900">{submittedCount}/{students.length}</strong>
            </span>
            {avgScore != null && (
              <span className="text-navy-700">
                Điểm TB <strong className="text-navy-900">{avgScore}</strong>
              </span>
            )}
          </div>
        </>
      )}

      <HomeworkAssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
