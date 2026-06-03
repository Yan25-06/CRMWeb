import { useState, useMemo, useEffect, useCallback } from 'react'
import { GraduationCap, FileText, Users, User, Search, UserCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, toast } from '@/components/ui'
import { RadarChartPanel }       from '@/components/reviews/RadarChartPanel'
import { ReviewHistory }         from '@/components/reviews/ReviewHistory'
import { ReviewForm }            from '@/components/reviews/ReviewForm'
import { ReportCardModal }       from '@/components/reviews/ReportCardModal'
import { DateRangeFilter }       from '@/components/reviews/DateRangeFilter'
import { AttendancePanel }       from '@/components/reviews/AttendancePanel'
import { HomeworkPanel }         from '@/components/reviews/HomeworkPanel'
import { GeneralCommentPanel }   from '@/components/reviews/GeneralCommentPanel'
import { ClassOverviewTable }    from '@/components/reviews/ClassOverviewTable'
import { useDebounce }           from '@/utils/useDebounce'
import { reviewService }         from '@/services/reviewService'
import { generalCommentService } from '@/services/generalCommentService'
import { classService }          from '@/services/classService'
import { studentService }        from '@/services/studentService'
import { enrollmentService }     from '@/services/enrollmentService'
import { attendanceService }     from '@/services/attendanceService'
import { homeworkService }       from '@/services/homeworkService'

const STORAGE_KEY = 'reviews_ui_state'

const getDefaultDateRange = () => {
  const now = new Date()
  const y   = now.getFullYear()
  const m   = String(now.getMonth() + 1).padStart(2, '0')
  return { fromDate: `${y}-${m}-01`, toDate: now.toISOString().split('T')[0] }
}

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

// Compact student list shown in the left panel (individual mode only)
const StudentList = ({ students, enrollmentMap, selectedClassId, selectedStudentId, onSelectStudent }) => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)

  useEffect(() => { setSearch('') }, [selectedClassId])

  const classStudentIds = selectedClassId ? (enrollmentMap.get(selectedClassId) ?? []) : []
  const classStudents   = students.filter(s => classStudentIds.includes(s.id))
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return q ? classStudents.filter(s => s.name.toLowerCase().includes(q)) : classStudents
  }, [classStudents, debouncedSearch])

  if (!selectedClassId) {
    return (
      <div className="p-4 text-sm text-navy-400 text-center">Chọn lớp để xem danh sách học viên</div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          className="input pl-8 text-sm w-full"
          placeholder="Tìm học viên..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-navy-400 text-center py-4">Không tìm thấy</p>
        ) : (
          filtered.map(s => (
            <button
              key={s.id}
              onClick={() => onSelectStudent(s.id)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border',
                selectedStudentId === s.id
                  ? 'bg-navy-800 text-white border-navy-800'
                  : 'bg-white text-navy-700 border-navy-100 hover:border-navy-300 hover:bg-navy-50'
              )}
            >
              <UserCircle size={20} className={selectedStudentId === s.id ? 'text-white/70' : 'text-navy-300'} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                {s.grade && (
                  <p className={clsx('text-xs', selectedStudentId === s.id ? 'text-white/60' : 'text-navy-400')}>
                    {s.grade}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export const ReviewsPage = ({ settings = {} }) => {
  // Restore persisted state on mount
  const saved = loadState()

  const [selectedClassId,   setSelectedClassIdRaw]   = useState(saved.selectedClassId   ?? null)
  const [selectedStudentId, setSelectedStudentIdRaw] = useState(saved.selectedStudentId ?? null)
  const [viewMode,          setViewModeRaw]          = useState(saved.viewMode          ?? 'individual')
  const [dateRange,         setDateRangeRaw]         = useState(saved.dateRange         ?? getDefaultDateRange())
  const [formOpen,      setFormOpen]    = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [reportOpen,    setReportOpen]   = useState(false)

  // Wrap setters to also persist to localStorage
  const persist = (patch) => {
    try {
      const current = loadState()
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }))
    } catch {}
  }

  const setSelectedClassId = (id) => {
    setSelectedClassIdRaw(id)
    persist({ selectedClassId: id })
  }
  const setSelectedStudentId = (id) => {
    setSelectedStudentIdRaw(id)
    persist({ selectedStudentId: id })
  }
  const setViewMode = (mode) => {
    setViewModeRaw(mode)
    persist({ viewMode: mode })
  }
  const setDateRange = (range) => {
    setDateRangeRaw(range)
    persist({ dateRange: range })
  }

  const [classes,        setClasses]        = useState([])
  const [students,       setStudents]       = useState([])
  const [enrollmentMap,  setEnrollmentMap]  = useState(new Map())
  const [reviews,        setReviews]        = useState([])
  const [generalComment, setGeneralComment] = useState(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)

  // Load classes + students once on mount
  useEffect(() => {
    Promise.all([classService.getAll(), studentService.getAll()])
      .then(([cls, stu]) => { setClasses(cls); setStudents(stu) })
      .catch(() => {})
  }, [])

  // Load enrollments for selected class
  useEffect(() => {
    if (!selectedClassId) { setEnrollmentMap(new Map()); return }
    enrollmentService.getByClass(selectedClassId)
      .then(enrollments => {
        const ids = enrollments.filter(e => e.status === 'active').map(e => e.studentId)
        setEnrollmentMap(new Map([[selectedClassId, ids]]))
      })
      .catch(() => {})
  }, [selectedClassId])

  const selectedStudent = students.find(s => s.id === selectedStudentId) ?? null
  const selectedClass   = classes.find(c => c.id === selectedClassId)   ?? null

  const loadReviews = useCallback(async () => {
    if (!selectedStudentId || !selectedClassId) { setReviews([]); setGeneralComment(null); return }
    setReviewsLoading(true)
    try {
      const [reviewData, commentData] = await Promise.all([
        reviewService.getByStudent(selectedStudentId, selectedClassId),
        generalCommentService.get(selectedStudentId, selectedClassId),
      ])
      setReviews(reviewData)
      setGeneralComment(commentData)
    } catch (err) {
      toast.error('Không tải được đánh giá: ' + err.message)
    } finally {
      setReviewsLoading(false)
    }
  }, [selectedStudentId, selectedClassId])

  useEffect(() => { loadReviews() }, [loadReviews])

  const filteredReviews = useMemo(
    () => reviews.filter(r => r.date >= dateRange.fromDate && r.date <= dateRange.toDate),
    [reviews, dateRange.fromDate, dateRange.toDate]
  )

  const latestReview = reviews[0] ?? null

  const [attendancePct, setAttendancePct] = useState(null)
  const [homeworkPct,   setHomeworkPct]   = useState(null)

  useEffect(() => {
    if (!selectedStudentId || !selectedClassId) { setAttendancePct(null); setHomeworkPct(null); return }
    Promise.all([
      attendanceService.getByRange(selectedStudentId, selectedClassId, dateRange.fromDate, dateRange.toDate),
      homeworkService.getByRange(selectedStudentId, selectedClassId, dateRange.fromDate, dateRange.toDate),
    ]).then(([attRecs, hwRecs]) => {
      if (attRecs.length) {
        const present = attRecs.filter(r => r.present !== false).length
        setAttendancePct(Math.round((present / attRecs.length) * 1000) / 10)
      } else {
        setAttendancePct(null)
      }
      if (hwRecs.length) {
        let done = 0, inProg = 0
        hwRecs.forEach(r => {
          if (r.progress === 'done' || r.progress === 100) done++
          else if (r.progress === 'in_progress' || r.progress === 50) inProg++
        })
        setHomeworkPct(Math.round((done * 100 + inProg * 50) / hwRecs.length))
      } else {
        setHomeworkPct(null)
      }
    }).catch(() => { setAttendancePct(null); setHomeworkPct(null) })
  }, [selectedStudentId, selectedClassId, dateRange.fromDate, dateRange.toDate])

  const handleSaveReview = async (data) => {
    try {
      await reviewService.upsert(data)
      toast.success(editingReview ? 'Đã cập nhật đánh giá' : 'Đã lưu đánh giá')
      await loadReviews()
    } catch (err) {
      toast.error('Lưu thất bại: ' + err.message)
    }
  }

  const openAdd  = () => { setEditingReview(null); setFormOpen(true) }
  const openEdit = (rev) => { setEditingReview(rev); setFormOpen(true) }

  const hasStudentSelected = !!(selectedClassId && selectedStudentId)

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Nhận Xét Học Viên</h1>
          <p className="text-sm text-navy-400 mt-0.5">Đánh giá năng lực và xuất phiếu kết quả</p>
        </div>
        {hasStudentSelected && viewMode === 'individual' && (
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

      {/* ── Toolbar: ViewModeToggle + Class selector + DateRangeFilter ── */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm px-4 py-3 flex flex-wrap items-center gap-3">

        {/* View mode toggle */}
        <div className="flex items-center bg-navy-50 rounded-xl p-1 gap-1 shrink-0">
          <button
            onClick={() => setViewMode('individual')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'individual' ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-500 hover:text-navy-700'
            )}
          >
            <User size={14} /> Cá Nhân
          </button>
          <button
            onClick={() => setViewMode('overview')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'overview' ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-500 hover:text-navy-700'
            )}
          >
            <Users size={14} /> Tổng Quan Lớp
          </button>
        </div>

        <div className="w-px h-6 bg-navy-100 shrink-0" />

        {/* Class selector — shared between both modes */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-navy-500 font-medium">Lớp</span>
          <select
            value={selectedClassId ?? ''}
            onChange={e => {
              setSelectedClassId(e.target.value || null)
              setSelectedStudentId(null)
            }}
            className="text-sm border border-navy-200 rounded-lg px-2.5 py-1.5 text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
          >
            <option value="">— Chọn lớp —</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        <div className="w-px h-6 bg-navy-100 shrink-0" />

        {/* Date range filter */}
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Left panel: student list (individual mode only) */}
        {viewMode === 'individual' && (
          <div className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-navy-100 shadow-navy-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-navy-50">
              <p className="text-xs font-semibold text-navy-500 uppercase tracking-wide">Học Viên</p>
            </div>
            <StudentList
              students={students}
              enrollmentMap={enrollmentMap}
              selectedClassId={selectedClassId}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
            />
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 min-w-0">

          {/* Overview mode */}
          {viewMode === 'overview' && (
            <ClassOverviewTable
              classId={selectedClassId}
              cls={selectedClass}
              dateRange={dateRange}
            />
          )}

          {/* Individual mode */}
          {viewMode === 'individual' && (
            !hasStudentSelected ? (
              <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-16 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 rounded-3xl bg-navy-50 flex items-center justify-center">
                  <GraduationCap size={28} className="text-navy-300" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-navy-700">
                    {selectedClassId ? 'Chọn học viên để xem nhận xét' : 'Chọn lớp và học viên'}
                  </p>
                  <p className="text-sm text-navy-400 mt-1">để xem và tạo đánh giá năng lực</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Student banner */}
                <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm px-5 py-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-navy-400">Học viên đang xem</p>
                    <p className="text-lg font-bold text-navy-900">{selectedStudent?.name}</p>
                  </div>
                  <span className="text-xs bg-navy-100 text-navy-700 px-3 py-1 rounded-full font-medium">
                    {selectedClass?.name}
                  </span>
                </div>

                {/* Radar + history */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="w-full md:w-1/2">
                    <RadarChartPanel reviews={filteredReviews} onAddReview={openAdd} />
                  </div>
                  <div className="w-full md:w-1/2">
                    <ReviewHistory reviews={filteredReviews} onEdit={openEdit} />
                  </div>
                </div>

                {/* Attendance + homework */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="w-full md:w-1/2">
                    <AttendancePanel
                      studentId={selectedStudentId}
                      classId={selectedClassId}
                      dateRange={dateRange}
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <HomeworkPanel
                      studentId={selectedStudentId}
                      classId={selectedClassId}
                      dateRange={dateRange}
                    />
                  </div>
                </div>

                {/* General comment */}
                <GeneralCommentPanel
                  studentId={selectedStudentId}
                  classId={selectedClassId}
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* Modals */}
      <ReviewForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingReview={editingReview}
        studentId={selectedStudentId}
        classId={selectedClassId}
        teacherName={settings?.teacherName}
        onSave={handleSaveReview}
      />

      <ReportCardModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        student={selectedStudent}
        cls={selectedClass}
        latestReview={latestReview}
        settings={settings}
        dateRange={dateRange}
        attendancePct={attendancePct}
        homeworkPct={homeworkPct}
        generalComment={generalComment}
      />
    </div>
  )
}
