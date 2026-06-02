import { useState, useMemo, useCallback, useEffect } from 'react'
import { clsx } from 'clsx'
import { Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button, toast, Empty } from '@/components/ui'
import { WeeklyGrid } from '@/components/schedule/WeeklyGrid'
import { DailyAgenda } from '@/components/schedule/DailyAgenda'
import { ScheduleModal } from '@/components/schedule/ScheduleModal'
import { scheduleService } from '@/services/scheduleService'
import { classService } from '@/services/classService'
import { enrollmentService } from '@/services/enrollmentService'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [scheduleItems, allClasses, allEnrollments] = await Promise.all([
        scheduleService.getAll(),
        classService.getAll(),
        enrollmentService.getAll(),
      ])
      setSchedule(scheduleItems)
      setClasses(allClasses)
      setEnrollments(allEnrollments)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Build student count map (classId → active student count)
  const studentCounts = useMemo(() => {
    const map = new Map()
    for (const cls of classes) {
      const active = enrollments.filter(e => e.classId === cls.id && e.status === 'active').length
      map.set(cls.id, active)
    }
    return map
  }, [classes, enrollments])

  // Today's items
  const todayDow = new Date().getDay()
  const todayItems = schedule.filter(s => s.dayOfWeek === todayDow)

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

      {/* ── Week navigation ──────────────────────────── */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-navy-100 shadow-navy-sm px-4 py-3">
        <button
          onClick={prevWeek}
          className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
          title="Tuần trước"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-navy-800">{formatWeekLabel(weekStart)}</p>
        </div>

        <button
          onClick={nextWeek}
          className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
          title="Tuần sau"
        >
          <ChevronRight size={18} />
        </button>

        {!isCurrentWeek && (
          <button
            onClick={goToday}
            className="text-xs font-medium text-navy-600 hover:text-navy-900 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Hôm nay
          </button>
        )}
      </div>

      {/* ── Main layout: Desktop = grid + sidebar, Mobile = agenda + grid ── */}
      <div className="flex gap-6 items-start">

        {/* Grid area */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-12 flex items-center justify-center">
              <p className="text-sm text-navy-400">Đang tải lịch dạy…</p>
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
          ) : schedule.length === 0 ? (
            <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-12">
              <Empty
                icon={<Calendar size={40} />}
                title="Chưa có lịch dạy nào"
                desc="Bấm '+ Xếp Lịch' để thêm ca dạy đầu tiên vào thời khóa biểu."
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
                scheduleItems={schedule}
                classes={classes}
                studentCounts={studentCounts}
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
            classes={classes}
            studentCounts={studentCounts}
            onAttendance={handleAttendance}
          />
        </div>
      </div>

      {/* Mobile DailyAgenda — shown above grid */}
      <div className="md:hidden -mt-2">
        <DailyAgenda
          todayItems={todayItems}
          classes={classes}
          studentCounts={studentCounts}
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
