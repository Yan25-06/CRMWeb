import { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { Users } from 'lucide-react'
import { Skeleton, Card, Button } from '@/components/ui'
import { StudentSidebar } from '@/components/students/StudentSidebar'
import { StudentDetailPanel } from '@/components/students/StudentDetailPanel'
import { EnrollmentModal } from '@/components/students/EnrollmentModal'
import { getStudents } from '@/services/studentService'
import { getEnrollmentsByClass } from '@/services/enrollmentService'

export const StudentsTab = ({ classId, onEnrollmentChange }) => {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')

  const loadData = useCallback(async () => {
    setLoading(true)
    const [allStudents, classEnrollments] = await Promise.all([
      getStudents(),
      getEnrollmentsByClass(classId),
    ])
    setStudents(allStudents)
    setEnrollments(classEnrollments)

    if (!selectedStudentId || !classEnrollments.find(e => e.studentId === selectedStudentId)) {
      const firstActive = classEnrollments.find(e => e.status === 'active')
      const first = firstActive || classEnrollments[0]
      setSelectedStudentId(first?.studentId || null)
    }
    setLoading(false)
    onEnrollmentChange?.()
  }, [classId])

  useEffect(() => { loadData() }, [classId])

  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(studentId)
    setMobileShowDetail(true)
  }

  const selectedStudent = students.find(s => s.id === selectedStudentId) || null
  const selectedEnrollment = selectedStudentId
    ? enrollments.find(e => e.studentId === selectedStudentId) || null
    : null

  if (!loading && enrollments.length === 0) {
    return (
      <>
        <Card className="p-16 flex flex-col items-center justify-center text-center gap-3">
          <Users size={48} className="text-navy-200" />
          <p className="font-semibold text-navy-700">Lớp chưa có học viên nào</p>
          <p className="text-sm text-navy-400">Bấm nút bên dưới để thêm học viên đầu tiên</p>
          <Button onClick={() => { setModalMode('add'); setModalOpen(true) }} className="mt-2">+ Thêm học viên</Button>
        </Card>
        <EnrollmentModal open={modalOpen} onClose={() => setModalOpen(false)} mode="add" classId={classId} onSaved={loadData} />
      </>
    )
  }

  if (loading) {
    return (
      <div className="flex gap-4 h-[600px]">
        <div className="w-72 shrink-0 flex flex-col gap-3 p-4 bg-white rounded-2xl border border-navy-100">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-32" />
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="hidden md:flex gap-4 h-full min-h-[600px]">
        <div className="w-72 shrink-0 h-full">
          <StudentSidebar
            enrollments={enrollments}
            students={students}
            activeId={selectedStudentId}
            onSelect={handleSelectStudent}
            onAddStudent={() => { setModalMode('add'); setModalOpen(true) }}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          {selectedStudent && selectedEnrollment ? (
            <StudentDetailPanel
              student={selectedStudent}
              enrollment={selectedEnrollment}
              onEdit={() => { setModalMode('edit'); setModalOpen(true) }}
              onStatusChange={loadData}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-navy-400">
              <p className="text-sm">Chọn học viên để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden relative overflow-hidden">
        <div className={clsx('transition-transform duration-300 ease-in-out', mobileShowDetail ? '-translate-x-full absolute inset-0' : 'translate-x-0')}>
          <StudentSidebar
            enrollments={enrollments}
            students={students}
            activeId={selectedStudentId}
            onSelect={handleSelectStudent}
            onAddStudent={() => { setModalMode('add'); setModalOpen(true) }}
          />
        </div>
        <div className={clsx('transition-transform duration-300 ease-in-out', mobileShowDetail ? 'translate-x-0' : 'translate-x-full absolute inset-0')}>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setMobileShowDetail(false)} className="flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-900 transition-colors">← Danh sách</button>
          </div>
          {selectedStudent && selectedEnrollment ? (
            <StudentDetailPanel
              student={selectedStudent}
              enrollment={selectedEnrollment}
              onEdit={() => { setModalMode('edit'); setModalOpen(true) }}
              onStatusChange={loadData}
            />
          ) : null}
        </div>
      </div>

      <EnrollmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        classId={classId}
        enrollment={modalMode === 'edit' ? selectedEnrollment : undefined}
        student={modalMode === 'edit' ? selectedStudent : undefined}
        onSaved={loadData}
      />
    </>
  )
}
