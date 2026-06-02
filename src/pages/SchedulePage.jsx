import { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button, toast, Empty } from '@/components/ui'
import { WeeklyGrid } from '@/components/schedule/WeeklyGrid'
import { DailyAgenda } from '@/components/schedule/DailyAgenda'
import { ScheduleModal } from '@/components/schedule/ScheduleModal'
import { getSchedule, addScheduleItem, updateScheduleItem, deleteScheduleItem } from '@/services/scheduleService'
import { getClasses } from '@/services/classService'
import { getEnrollmentsByClass } from '@/services/enrollmentService'

const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
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
  return `${s} – ${e}, ${weekStart.getFullYear()}`
}

export const SchedulePage = ({ onNavigate }) => {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [defaultDay, setDefaultDay] = useState(null)
  const [schedule, setSchedule] = useState([])
  const [classes, setClasses] = useState([])
  const [studentCounts, setStudentCounts] = useState(new Map())

  const loadData = useCallback(async () => {
    const [sched, cls] = await Promise.all([getSchedule(), getClasses()])
    setSchedule(sched)
    setClasses(cls)
    const counts = new Map()
    await Promise.all(cls.map(async c => {
      const enrollments = await getEnrollmentsByClass(c.id)
      counts.set(c.id, enrollments.filter(e => e.status === 'active').length)
    }))
    setStudentCounts(counts)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const todayDow = new Date().getDay()
  const todayItems = schedule.filter(s => s.dayOfWeek === todayDow)

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
    if (isEdit) {
      await updateScheduleItem(id, data)
      toast.success('Đã cập nhật lịch dạy')
    } else {
      await addScheduleItem(data)
      toast.success('Đã thêm lịch dạy')
    }
    await loadData()
  }, [loadData])

  const handleDelete = useCallback(async (id) => {
    await deleteScheduleItem(id)
    toast.success('Đã xóa lịch dạy')
    await loadData()
  }, [loadData])

  const prevWeek = () => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() - 7); return d })
  const nextWeek = () => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() + 7); return d })
  const goToday  = () => setWeekStart(getWeekStart(new Date()))
  const isCurrentWeek = getWeekStart(new Date()).getTime() === weekStart.getTime()

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Lịch Dạy</h1>
          <p className="text-sm text-navy-400 mt-0.5">Quản lý thời khóa biểu cố định hàng tuần</p>
        </div>
        <Button variant="primary" size="md" onClick={() => openAdd(null)} className="flex items-center gap-2 shrink-0">
          <Plus size={16} /> Xếp Lịch
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-white rounded-2xl border border-navy-100 shadow-navy-sm px-4 py-3">
        <button onClick={prevWeek} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors" title="Tuần trước">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-navy-800">{formatWeekLabel(weekStart)}</p>
        </div>
        <button onClick={nextWeek} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors" title="Tuần sau">
          <ChevronRight size={18} />
        </button>
        {!isCurrentWeek && (
          <button onClick={goToday} className="text-xs font-medium text-navy-600 hover:text-navy-900 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg transition-colors">
            Hôm nay
          </button>
        )}
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          {schedule.length === 0 ? (
            <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-12">
              <Empty
                icon={<Calendar size={40} />}
                title="Chưa có lịch dạy nào"
                desc="Bấm '+ Xếp Lịch' để thêm ca dạy đầu tiên vào thời khóa biểu."
                action={
                  <Button variant="primary" size="sm" onClick={() => openAdd(null)} className="flex items-center gap-1.5">
                    <Plus size={14} /> Xếp Lịch Đầu Tiên
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-4">
              <WeeklyGrid scheduleItems={schedule} classes={classes} studentCounts={studentCounts} onEdit={openEdit} onAddDay={openAdd} />
            </div>
          )}
        </div>

        <div className="w-72 shrink-0 hidden md:block">
          <DailyAgenda todayItems={todayItems} classes={classes} studentCounts={studentCounts} onAttendance={() => onNavigate?.('classes')} />
        </div>
      </div>

      <div className="md:hidden -mt-2">
        <DailyAgenda todayItems={todayItems} classes={classes} studentCounts={studentCounts} onAttendance={() => onNavigate?.('classes')} />
      </div>

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
