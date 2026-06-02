import { useState, useEffect, useMemo } from 'react'
import {
  Users, TrendingUp, Calendar, DollarSign,
  BookOpen, Clock,
} from 'lucide-react'
import { StatCard, Card, Badge, Skeleton } from '@/components/ui'
import {
  getDashboardStats,
  getAttendanceByDate,
} from '@/store/db'
import { studentService } from '@/services/studentService'
import { classService } from '@/services/classService'

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN').format(n) + 'đ'

export const DashboardPage = ({ year, month, onNavigate }) => {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([studentService.getAll(), classService.getAll()])
      .then(([s, c]) => { setStudents(s); setClasses(c) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Revenue/attendance stats still come from localStorage (sessions/attendance not migrated yet)
  const stats = useMemo(() => getDashboardStats(year, month), [year, month])

  const today = new Date().toISOString().split('T')[0]
  const todayAtt = useMemo(() => getAttendanceByDate(today), [today])

  const monthName = new Date(year, month - 1).toLocaleString('vi-VN', { month: 'long' })

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[1,2].map(card => (
            <div key={card} className="rounded-2xl border border-navy-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-navy-50 flex items-center justify-between">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="divide-y divide-navy-50">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-900">Dashboard</h1>
        <p className="text-sm text-navy-400 mt-0.5">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Học Sinh"
          value={students.length || stats.totalStudents}
          sub={`${classes.length || stats.totalClasses} lớp`}
          icon={<Users size={16} />}
          accent="navy"
        />
        <StatCard
          label="Có Mặt Hôm Nay"
          value={todayAtt.filter(a => a.present).length}
          sub={`trong ${students.length || stats.totalStudents} học sinh`}
          icon={<Calendar size={16} />}
          accent="success"
        />
        <StatCard
          label={`Doanh Thu ${monthName}`}
          value={fmt(stats.monthlyRevenue)}
          sub="tổng học phí tháng"
          icon={<DollarSign size={16} />}
          accent="warning"
        />
        <StatCard
          label={`Doanh Thu ${year}`}
          value={fmt(stats.yearlyRevenue)}
          sub="tổng cả năm"
          icon={<TrendingUp size={16} />}
          accent="navy"
        />
      </div>

      {/* ── Student list quick view ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-50 flex items-center justify-between">
            <h2 className="font-semibold text-navy-800 text-sm">Danh Sách Học Sinh</h2>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs text-navy-500 hover:text-navy-800 font-medium transition-colors"
            >
              Xem tất cả →
            </button>
          </div>
          {students.length === 0 ? (
            <div className="px-5 py-10 text-center text-navy-400 text-sm">
              Chưa có học sinh nào
            </div>
          ) : (
            <div className="divide-y divide-navy-50">
              {students.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-navy-50 transition-colors cursor-pointer" onClick={() => onNavigate('students')}>
                  <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold text-sm shrink-0">
                    {s.name.split(' ').pop()?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-navy-800 truncate">{s.name}</div>
                    <div className="text-xs text-navy-400">{s.grade}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Classes */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-50 flex items-center justify-between">
            <h2 className="font-semibold text-navy-800 text-sm">Các Lớp Học</h2>
            <button
              onClick={() => onNavigate('classes')}
              className="text-xs text-navy-500 hover:text-navy-800 font-medium transition-colors"
            >
              Quản lý →
            </button>
          </div>
          {classes.length === 0 ? (
            <div className="px-5 py-10 text-center text-navy-400 text-sm">
              Chưa có lớp nào
            </div>
          ) : (
            <div className="divide-y divide-navy-50">
              {classes.map(cls => (
                <div
                  key={cls.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-navy-50 transition-colors cursor-pointer"
                  onClick={() => onNavigate('classes')}
                >
                  <div className="w-8 h-8 rounded-xl bg-navy-800 flex items-center justify-center text-white shrink-0">
                    <BookOpen size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-navy-800">{cls.name}</div>
                    {cls.level && <div className="text-xs text-navy-400">Trình độ: {cls.level}</div>}
                  </div>
                  <Badge variant="navy">{cls.courseType || ''}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="text-sm font-semibold text-navy-600 uppercase tracking-wide mb-3">Thao Tác Nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Điểm Danh Hôm Nay', page: 'attendance', accent: 'bg-navy-800 text-white' },
            { label: 'Nhập Học Phí',       page: 'fees',       accent: 'bg-emerald-700 text-white' },
            { label: 'Nhận Xét HS',        page: 'reviews',    accent: 'bg-amber-600 text-white' },
            { label: 'Xem Lịch Dạy',       page: 'schedule',   accent: 'bg-navy-600 text-white' },
          ].map(({ label, page, accent }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`${accent} rounded-2xl p-4 text-left hover:opacity-90 active:scale-[0.97] transition-all duration-200 shadow-navy-sm`}
            >
              <div className="text-sm font-medium leading-snug">{label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
