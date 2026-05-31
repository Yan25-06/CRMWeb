import { useState, useMemo } from 'react'
import { GraduationCap, FileText } from 'lucide-react'
import { Button, toast } from '@/components/ui'
import { ReviewSelector }   from '@/components/reviews/ReviewSelector'
import { RadarChartPanel }  from '@/components/reviews/RadarChartPanel'
import { ReviewHistory }    from '@/components/reviews/ReviewHistory'
import { ReviewForm }       from '@/components/reviews/ReviewForm'
import { ReportCardModal }  from '@/components/reviews/ReportCardModal'
import {
  getClasses, getStudents, getEnrollmentsByClass,
  getReviewsByStudent, upsertReview, getSettings,
} from '@/store/db'

export const ReviewsPage = () => {
  const [selectedClassId,   setSelectedClassId]   = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [formOpen,          setFormOpen]          = useState(false)
  const [editingReview,     setEditingReview]     = useState(null)
  const [reportOpen,        setReportOpen]        = useState(false)
  const [refreshKey,        setRefreshKey]        = useState(0) // force re-read

  // Data
  const classes  = getClasses()
  const students = getStudents()
  const settings = getSettings()

  // Build enrollmentMap: classId → [studentId] (active only)
  const enrollmentMap = useMemo(() => {
    const map = new Map()
    for (const cls of classes) {
      const ids = getEnrollmentsByClass(cls.id)
        .filter(e => e.status === 'active')
        .map(e => e.studentId)
      map.set(cls.id, ids)
    }
    return map
  }, [classes.length, refreshKey])

  const selectedStudent = students.find(s => s.id === selectedStudentId) ?? null
  const selectedClass   = classes.find(c => c.id === selectedClassId) ?? null

  // Reviews for selected student in selected class
  const reviews = useMemo(() => {
    if (!selectedStudentId || !selectedClassId) return []
    return getReviewsByStudent(selectedStudentId, selectedClassId)
  }, [selectedStudentId, selectedClassId, refreshKey])

  const latestReview = reviews[0] ?? null

  const handleSaveReview = (data) => {
    upsertReview(data)
    toast.success(editingReview ? 'Đã cập nhật đánh giá' : 'Đã lưu đánh giá')
    setRefreshKey(k => k + 1)
  }

  const openAdd = () => {
    setEditingReview(null)
    setFormOpen(true)
  }
  const openEdit = (rev) => {
    setEditingReview(rev)
    setFormOpen(true)
  }

  const hasStudentSelected = !!(selectedClassId && selectedStudentId)

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Nhận Xét Học Viên</h1>
          <p className="text-sm text-navy-400 mt-0.5">Đánh giá năng lực và xuất phiếu kết quả</p>
        </div>
        {hasStudentSelected && (
          <Button
            variant="secondary" size="md"
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-2 shrink-0"
          >
            <FileText size={16} />
            Xuất Phiếu Gửi Phụ Huynh
          </Button>
        )}
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Left: Selector panel ─────────────────────── */}
        <div className="w-full lg:w-72 shrink-0 bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-4">
          <ReviewSelector
            classes={classes}
            students={students}
            enrollmentMap={enrollmentMap}
            selectedClassId={selectedClassId}
            selectedStudentId={selectedStudentId}
            onSelectClass={(id) => { setSelectedClassId(id); setSelectedStudentId(null) }}
            onSelectStudent={setSelectedStudentId}
          />
        </div>

        {/* ── Right: Review content ─────────────────────── */}
        <div className="flex-1 min-w-0">
          {!hasStudentSelected ? (
            <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-16 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-navy-50 flex items-center justify-center">
                <GraduationCap size={28} className="text-navy-300" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-semibold text-navy-700">Chọn lớp và học viên</p>
                <p className="text-sm text-navy-400 mt-1">để xem và tạo đánh giá năng lực</p>
              </div>
            </div>
          ) : (
            /* Desktop: 2-col; Mobile: stacked */
            <div className="flex flex-col gap-4">
              {/* Student name banner */}
              <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm px-5 py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-navy-400">Học viên đang xem</p>
                  <p className="text-lg font-bold text-navy-900">{selectedStudent?.name}</p>
                </div>
                <span className="text-xs bg-navy-100 text-navy-700 px-3 py-1 rounded-full font-medium">
                  {selectedClass?.name}
                </span>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Radar chart */}
                <div className="w-full md:w-1/2">
                  <RadarChartPanel
                    reviews={reviews}
                    onAddReview={openAdd}
                  />
                </div>

                {/* Review history */}
                <div className="w-full md:w-1/2">
                  <ReviewHistory
                    reviews={reviews}
                    onEdit={openEdit}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review form modal */}
      <ReviewForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingReview={editingReview}
        studentId={selectedStudentId}
        classId={selectedClassId}
        teacherName={settings?.teacherName}
        onSave={handleSaveReview}
      />

      {/* Report card modal */}
      <ReportCardModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        student={selectedStudent}
        cls={selectedClass}
        latestReview={latestReview}
        settings={settings}
      />
    </div>
  )
}
