import { useState, useEffect, useRef, useMemo } from 'react'
import { clsx } from 'clsx'
import { FileText, Plus, ArrowLeft, ClipboardList, Calendar, Pencil } from 'lucide-react'
import { Button, Card, Badge, toast } from '@/components/ui'
import { SessionSelector } from '@/components/classes/SessionSelector'
import { SessionModal } from '@/components/classes/SessionModal'
import { ProgressBadge } from '@/components/homework/ProgressBadge'
import { HomeworkNoteCell } from '@/components/homework/HomeworkNoteCell'
import { HomeworkSummaryFooter } from '@/components/homework/HomeworkSummaryFooter'
import { StudentHomeworkPanel } from '@/components/homework/StudentHomeworkPanel'
import { HomeworkAssignmentModal } from '@/components/homework/HomeworkAssignmentModal'
import { SubmissionTable } from '@/components/homework/SubmissionTable'
import { getSessionsByClass } from '@/services/sessionService'
import { getStudents } from '@/services/studentService'
import { getEnrollmentsByClass } from '@/services/enrollmentService'
import {
  getHomeworkBySession, updateHomework, updateSessionHomeworkTitle,
  addHomework, getHomeworksByClass,
} from '@/services/homeworkService'
import {
  getHwAssignmentsByClass, createHwAssignment, updateHwAssignment, deleteHwAssignment,
} from '@/services/hwAssignmentService'
import {
  getSubmissionsByAssignment, getSubmissionsByAssignments,
} from '@/services/submissionService'
import { getActiveStudents } from '@/services/enrollmentService'
import { getInitials, fmtDate } from '@/utils/helpers'

const MODE = { SESSION: 'session', ASSIGN: 'assign' }

export const HomeworkTab = ({ classId }) => {
  const [mode, setMode] = useState(MODE.SESSION)
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [students, setStudents] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [records, setRecords] = useState([])
  const [classHomeworks, setClassHomeworks] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [sharedTitle, setSharedTitle] = useState('')
  const titleTimerRef = useRef(null)

  const loadClass = async () => {
    const [classSessions, allStudents, classEnrolls, allClassHw] = await Promise.all([
      getSessionsByClass(classId),
      getStudents(),
      getEnrollmentsByClass(classId),
      getHomeworksByClass(classId),
    ])
    setSessions(classSessions)
    const activeEnrolls = classEnrolls.filter(e => e.status !== 'dropped')
    setEnrollments(activeEnrolls)
    setStudents(allStudents.filter(s => activeEnrolls.some(e => e.studentId === s.id)))
    setClassHomeworks(allClassHw)
    if (!activeSessionId && classSessions.length > 0) {
      setActiveSessionId(classSessions[0].id)
    }
  }

  useEffect(() => { loadClass() }, [classId])

  useEffect(() => {
    if (!activeSessionId) { setRecords([]); setSharedTitle(''); return }
    getHomeworkBySession(activeSessionId).then(hwRecords => {
      setRecords(hwRecords)
      setSharedTitle(hwRecords.length > 0 ? hwRecords[0].title || '' : '')
    })
  }, [activeSessionId])

  const handleSessionSaved = async (newId) => {
    const classSessions = await getSessionsByClass(classId)
    setSessions(classSessions)
    setActiveSessionId(newId)
    setClassHomeworks(await getHomeworksByClass(classId))
  }

  const handleProgressChange = async (recordId, newProgress) => {
    await updateHomework(recordId, { progress: newProgress })
    const updated = await getHomeworkBySession(activeSessionId)
    setRecords(updated)
    setClassHomeworks(prev => prev.map(h => h.id === recordId ? { ...h, progress: newProgress } : h))
    toast.success('Đã lưu tiến độ', { duration: 1500 })
  }

  const handleNoteChange = async (recordId, note) => {
    await updateHomework(recordId, { note })
    setRecords(await getHomeworkBySession(activeSessionId))
  }

  const handleTitleChange = (val) => {
    setSharedTitle(val)
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current)
    titleTimerRef.current = setTimeout(async () => {
      if (activeSessionId) {
        await updateSessionHomeworkTitle(activeSessionId, val)
        setRecords(await getHomeworkBySession(activeSessionId))
      }
    }, 600)
  }

  const handleAddMissingRecord = async (studentId) => {
    if (!activeSessionId) return
    const now = new Date().toISOString()
    await addHomework({
      sessionId: activeSessionId,
      studentId,
      progress: 'not_done',
      title: sharedTitle,
      note: '',
      createdAt: now,
      updatedAt: now,
    })
    setRecords(await getHomeworkBySession(activeSessionId))
    setClassHomeworks(await getHomeworksByClass(classId))
  }

  // Compute homework stats for all students from preloaded classHomeworks
  const hwStatsMap = useMemo(() => {
    if (students.length === 0) return {}
    const classSessionIds = new Set(sessions.map(s => s.id))
    const classHws = classHomeworks.filter(h => classSessionIds.has(h.sessionId))
    return Object.fromEntries(students.map(student => {
      const studentHws = classHws.filter(h => h.studentId === student.id)
      const stats = { done: 0, inProgress: 0, notDone: 0, total: studentHws.length }
      studentHws.forEach(r => {
        if (r.progress === 'done') stats.done++
        else if (r.progress === 'in_progress') stats.inProgress++
        else stats.notDone++
      })
      return [student.id, stats]
    }))
  }, [students, sessions, classHomeworks])

  return (
    <div className="flex flex-col gap-6 relative h-full min-h-[500px]">
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

      {mode === MODE.SESSION && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-navy-100 shadow-navy-sm">
            <SessionSelector sessions={sessions} activeSessionId={activeSessionId} onSelect={setActiveSessionId} onAddNew={() => setSessionModalOpen(true)} />
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

          {!activeSessionId ? (
            <Card className="p-16 flex flex-col items-center justify-center text-center gap-3">
              <FileText size={48} className="text-navy-200" />
              <p className="font-semibold text-navy-700">Chưa có buổi học nào</p>
              <p className="text-sm text-navy-400">Tạo buổi đầu tiên ở tab Điểm Danh hoặc thêm tại đây</p>
              <Button onClick={() => setSessionModalOpen(true)} className="mt-2">+ Tạo buổi học</Button>
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
                      const hwStats = hwStatsMap[student.id] ?? { done: 0, inProgress: 0, notDone: 0, total: 0 }
                      const hwRate = hwStats.total > 0 ? Math.round((hwStats.done * 100 + hwStats.inProgress * 50) / hwStats.total) : 0

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
                              isPaused ? 'text-navy-300' : hwRate >= 80 ? 'text-emerald-600' : hwRate >= 50 ? 'text-amber-600' : 'text-red-600'
                            )}>
                              {hwStats.total > 0 ? `${hwRate}%` : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                            {record ? (
                              <ProgressBadge progress={record.progress} disabled={isPaused} onChange={(val) => handleProgressChange(record.id, val)} />
                            ) : (
                              <Button variant="ghost" size="sm" className="text-xs text-navy-500" onClick={() => handleAddMissingRecord(student.id)}>
                                <Plus size={14} className="mr-1" /> Thêm
                              </Button>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            {record ? (
                              <HomeworkNoteCell note={record.note} disabled={isPaused} onSave={(note) => handleNoteChange(record.id, note)} />
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

          <SessionModal open={sessionModalOpen} onClose={() => setSessionModalOpen(false)} classId={classId} onSaved={handleSessionSaved} />
          {selectedStudent && (
            <StudentHomeworkPanel student={selectedStudent} classId={classId} onClose={() => setSelectedStudent(null)} />
          )}
        </>
      )}

      {mode === MODE.ASSIGN && <AssignView classId={classId} />}
    </div>
  )
}

const AssignView = ({ classId }) => {
  const [assignments, setAssignments] = useState([])
  const [selected, setSelected] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [allSubs, setAllSubs] = useState([])
  const [students, setStudents] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)

  const refresh = async () => {
    const [as, activeStudents] = await Promise.all([
      getHwAssignmentsByClass(classId),
      getActiveStudents(classId),
    ])
    setAssignments(as)
    setStudents(activeStudents)
    if (as.length > 0) {
      const subs = await getSubmissionsByAssignments(as.map(a => a.id))
      setAllSubs(subs)
    } else {
      setAllSubs([])
    }
  }

  useEffect(() => { refresh() }, [classId])

  const openAssignment = async (a) => {
    setSelected(a)
    setSubmissions(await getSubmissionsByAssignment(a.id))
  }

  const handleSave = async (data) => {
    await createHwAssignment({ ...data, classId })
    toast.success('Đã thêm bài tập!')
    await refresh()
    setModalOpen(false)
  }

  const handleEditSave = async (data) => {
    await updateHwAssignment(editingAssignment.id, data)
    toast.success('Đã cập nhật bài tập!')
    await refresh()
    setEditingAssignment(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa bài tập này? Tất cả dữ liệu nộp bài sẽ bị xóa.')) return
    await deleteHwAssignment(id)
    if (selected?.id === id) setSelected(null)
    await refresh()
    toast.success('Đã xóa bài tập')
  }

  const refreshSubmissions = async () => {
    if (selected) setSubmissions(await getSubmissionsByAssignment(selected.id))
    if (assignments.length > 0) {
      setAllSubs(await getSubmissionsByAssignments(assignments.map(a => a.id)))
    }
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
      {selected && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors">
              <ArrowLeft size={16} />
            </button>
            <h3 className="font-semibold text-navy-800">{selected.title}</h3>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setSelected(null)}>
            <ArrowLeft size={14} className="mr-1" /> Danh sách
          </Button>
        </div>
      )}

      {!selected && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} className="mr-1" /> Thêm bài tập
          </Button>
        </div>
      )}

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
                  const cnt = allSubs.filter(s => s.hwAssignmentId === a.id && s.submitted).length
                  return (
                    <tr key={a.id} className="hover:bg-navy-50/40 cursor-pointer transition-colors" onClick={() => openAssignment(a)}>
                      <td className="px-5 py-3 font-medium text-navy-900">{a.title}</td>
                      <td className="px-5 py-3 text-navy-500">{fmtDate(a.assignedAt)}</td>
                      <td className="px-5 py-3">
                        {a.dueDate
                          ? <span className={clsx('text-sm', isOverdue(a) ? 'text-red-500 font-medium' : 'text-navy-500')}>
                              {fmtDate(a.dueDate)}{isOverdue(a) && ' (quá hạn)'}
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
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={e => { e.stopPropagation(); setEditingAssignment(a) }} className="p-1 rounded text-navy-300 hover:text-navy-700 hover:bg-navy-50 transition-colors" title="Sửa bài tập">
                            <Pencil size={14} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(a.id) }} className="p-1 rounded text-navy-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Xóa bài tập">
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {selected && (
        <>
          {selected.description && <p className="text-sm text-navy-500 bg-navy-50 rounded-xl px-4 py-2">{selected.description}</p>}
          <SubmissionTable students={students} submissions={submissions} hwAssignmentId={selected.id} onUpdate={refreshSubmissions} />
          <div className="bg-navy-50 border border-navy-100 rounded-2xl px-5 py-3 flex items-center gap-6 text-sm">
            <span className="text-navy-700">Đã nộp <strong className="text-navy-900">{submittedCount}/{students.length}</strong></span>
            {avgScore != null && <span className="text-navy-700">Điểm TB <strong className="text-navy-900">{avgScore}</strong></span>}
          </div>
        </>
      )}

      <HomeworkAssignmentModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
      <HomeworkAssignmentModal open={!!editingAssignment} onClose={() => setEditingAssignment(null)} initial={editingAssignment} onSave={handleEditSave} />
    </div>
  )
}
