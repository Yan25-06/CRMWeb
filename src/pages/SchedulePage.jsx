import { useState, useMemo, useCallback, useEffect } from 'react'
import { clsx } from 'clsx'
import { Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button, toast, Empty, Skeleton } from '@/components/ui'
import { WeeklyGrid } from '@/components/schedule/WeeklyGrid'
import { DailyAgenda } from '@/components/schedule/DailyAgenda'
import { ScheduleModal } from '@/components/schedule/ScheduleModal'
import { scheduleService } from '@/services/scheduleService'
import { classService, teacherService } from '@/services/classService'
import { enrollmentService } from '@/services/enrollmentService'
import { useAuth } from '@/hooks/useAuth'

// ─── Helpers ────────────────────────────────────────────────
const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  // Monday = start of week for Vietnamese convention
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const formatWeekLabel = (weekStart) => {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const opts = { day: 'numeric', month: 'numeric' }
  const s = weekStart.toLocaleDateString('vi-VN', opts)
  const e = end.toLocaleDateString('vi-VN', opts)
  const year = weekStart.getFullYear()
  return `${s} – ${e}, ${year}`
}

// ─── SchedulePage ────────────────────────────────────────────
export const SchedulePage = ({ onNavigate }) => {
  const { teacher } = useAuth()
  const isAdmin = teacher?.is_admin === true

  // Week navigation state
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))

  // Modal state
  const [modalOpen, setModalOpen]     = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [defaultDay, setDefaultDay]   = useState(null)

  // Data loaded from services
  const [schedule, setSchedule] = useState([])
  const [classes, setClasses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Admin filter
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const requests = [
        scheduleService.getAll(),
        classService.getAll(),
        enrollmentService.getAll(),
      ]
      if (isAdmin) requests.push(teacherService.getAll())
      const [scheduleItems, allClasses, allEnrollments, allTeachers] = await Promise.all(requests)
      setSchedule(scheduleItems)
      setClasses(allClasses)
      setEnrollments(allEnrollments)
      if (allTeachers) setTeachers(allTeachers)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => { loadData() }, [loadData])

  // Admin filter: narrow classes and schedule by selected teacher
  const visibleClasses = useMemo(() => {
    if (!isAdmin || !selectedTeacherId) return classes
    return classes.filter(c => c.teacherId === selectedTeacherId)
  }, [classes, isAdmin, selectedTeacherId])

  const visibleClassIds = useMemo(() => new Set(visibleClasses.map(c => c.id)), [visibleClasses])

  const visibleSchedule = useMemo(() => {
    if (!isAdmin || !selectedTeacherId) return schedule
    return schedule.filter(s => visibleClassIds.has(s.classId))
  }, [schedule, isAdmin, selectedTeacherId, visibleClassIds])

  // Build student count map (classId → active student count)
  const studentCounts = useMemo(() => {
    const map = new Map()
    for (const cls of visibleClasses) {
      const active = enrollments.filter(e => e.classId === cls.id && e.status === 'active').length
      map.set(cls.id, active)
    }
    return map
  }, [visibleClasses, enrollments])

  // Today's items
  const todayDow = new Date().getDay()
  const todayItems = visibleSchedule.filter(s => s.dayOfWeek === todayDow)

  // Whether to show teacher name on cards (admin viewing all teachers)
  const showTeacher = isAdmin && !selectedTeacherId

  // Handlers
  const openAdd = useCallback((day) => {
    setEditingItem(null)
    setDefaultDay(day ?? null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item) => {
    setEditingItem(item)
    setDefaultDay(null)
    setModalOpen(true)
  }, [])

  const handleSave = useCallback(async ({ data, isEdit, id }) => {
    try {
      if (isEdit) {
        await scheduleService.update(id, data)
        toast.success('Đã cập nhật lịch dạy')
      } else {
        await scheduleService.add(data)
        toast.success('Đã thêm lịch dạy')
      }
      await loadData()
    } catch {
      toast.error('Không thể lưu lịch dạy')
    }
  }, [loadData])

  const handleDelete = useCallback(async (id) => {
    try {
      await scheduleService.remove(id)
      toast.success('Đã xóa lịch dạy')
      await loadData()
    } catch {
      toast.error('Không thể xóa lịch dạy')
    }
  }, [loadData])

  const handleAttendance = useCallback((classId) => {
    onNavigate?.('classes')
  }, [onNavigate])

  const prevWeek = () => setWeekStart(w => {
    const d = new Date(w); d.setDate(d.getDate() - 7); return d
  })
  const nextWeek = () => setWeekStart(w => {
    const d = new Date(w); d.setDate(d.getDate() + 7); return d
  })
  const goToday  = () => setWeekStart(getWeekStart(new Date()))

  const isCurrentWeek = getWeekStart(new Date()).getTime() === weekStart.getTime()

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* ── Page Header ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Lịch Dạy</h1>
          <p className="text-sm text-navy-400 mt-0.5">Quản lý thời khóa biểu cố định hàng tuần</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => openAdd(null)}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Xếp Lịch
        </Button>
      </div>

      {/* ── Week navigation + Teacher filter ─────────── */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-navy-100 shadow-navy-sm px-3 py-2">
        {/* Week prev/next */}
        <button
          onClick={prevWeek}
          className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors shrink-0"
          title="Tuần trước"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="text-center shrink-0">
          <p className="text-xs font-semibold text-navy-800 whitespace-nowrap">{formatWeekLabel(weekStart)}</p>
        </div>

        <button
          onClick={nextWeek}
          className="p-1 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors shrink-0"
          title="Tuần sau"
        >
          <ChevronRight size={16} />
        </button>

        {!isCurrentWeek && (
          <button
            onClick={goToday}
            className="text-xs font-medium text-navy-600 hover:text-navy-900 bg-navy-50 hover:bg-navy-100 px-2.5 py-1 rounded-lg transition-colors shrink-0"
          >
            Hôm nay
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Admin: Teacher filter dropdown */}
        {isAdmin && teachers.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-navy-400 hidden sm:block">Giáo viên:</span>
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="text-xs border border-navy-200 rounded-lg px-2.5 py-1.5 text-navy-700 bg-navy-50 hover:bg-navy-100 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-colors cursor-pointer"
            >
              <option value="">Tất cả giáo viên</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name || t.email}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Main layout: Desktop = grid + sidebar, Mobile = agenda + grid ── */}
      <div className="flex gap-6 items-start">

        {/* Grid area */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-4">
              <div className="grid grid-cols-7 gap-2 mb-3">
                {[1,2,3,4,5,6,7].map(i => <Skeleton key={i} className="h-6 rounded-lg" />)}
              </div>
              {[1,2,3].map(row => (
                <div key={row} className="grid grid-cols-7 gap-2 mb-2">
                  {[1,2,3,4,5,6,7].map(col => (
                    <Skeleton key={col} className="h-16 rounded-xl" />
                  ))}
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-12">
              <Empty
                icon={<Calendar size={40} />}
                title="Không thể tải lịch dạy"
                desc="Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại."
                action={
                  <Button variant="primary" size="sm" onClick={loadData}>Thử lại</Button>
                }
              />
            </div>
          ) : visibleSchedule.length === 0 ? (
            <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-12">
              <Empty
                icon={<Calendar size={40} />}
                title={selectedTeacherId ? 'Giáo viên này chưa có lịch dạy' : 'Chưa có lịch dạy nào'}
                desc={selectedTeacherId ? 'Thử chọn giáo viên khác hoặc bấm "+ Xếp Lịch".' : "Bấm '+ Xếp Lịch' để thêm ca dạy đầu tiên vào thời khóa biểu."}
                action={
                  <Button variant="primary" size="sm" onClick={() => openAdd(null)} className="flex items-center gap-1.5">
                    <Plus size={14} />
                    Xếp Lịch Đầu Tiên
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-4">
              <WeeklyGrid
                scheduleItems={visibleSchedule}
                classes={visibleClasses}
                studentCounts={studentCounts}
                showTeacher={showTeacher}
                onEdit={openEdit}
                onAddDay={openAdd}
              />
            </div>
          )}
        </div>

        {/* Sidebar — DailyAgenda (desktop: beside grid, mobile: hidden, shown above grid by DailyAgenda) */}
        <div className="w-72 shrink-0 hidden md:block">
          <DailyAgenda
            todayItems={todayItems}
            classes={visibleClasses}
            studentCounts={studentCounts}
            showTeacher={showTeacher}
            onAttendance={handleAttendance}
          />
        </div>
      </div>

      {/* Mobile DailyAgenda — shown above grid */}
      <div className="md:hidden -mt-2">
        <DailyAgenda
          todayItems={todayItems}
          classes={visibleClasses}
          studentCounts={studentCounts}
          showTeacher={showTeacher}
          onAttendance={handleAttendance}
        />
      </div>

      {/* ── Modal ──────────────────────────────────────── */}
      <ScheduleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingItem={editingItem}
        defaultDay={defaultDay}
        classes={classes}
        allSchedule={schedule}
        onSave={handleSave}
        onDelete={handleDelete}
      />

    </div>
  )
}
