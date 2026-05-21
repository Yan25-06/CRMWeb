import { useMemo } from 'react'
import {
  Users, TrendingUp, Calendar, DollarSign,
  BookOpen, Clock,
} from 'lucide-react'
import { StatCard, Card, Badge } from '@/components/ui'
import {
  getDashboardStats, getStudents, getClasses,
  getAttendanceByDate,
} from '@/store/db'

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN').format(n) + 'đ'

export const DashboardPage = ({ year, month, onNavigate }) => {
  const stats    = useMemo(() => getDashboardStats(year, month), [year, month])
  const students = useMemo(() => getStudents(), [])
  const classes  = useMemo(() => getClasses(), [])

  const today = new Date().toISOString().split('T')[0]
  const todayAtt = useMemo(() => getAttendanceByDate(today), [today])

  const monthName = new Date(year, month - 1).toLocaleString('vi-VN', { month: 'long' })

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
          value={stats.totalStudents}
          sub={`${stats.totalClasses} lớp`}
          icon={<Users size={16} />}
          accent="navy"
        />
        <StatCard
          label="Có Mặt Hôm Nay"
          value={todayAtt.filter(a => a.present).length}
          sub={`trong ${students.length} học sinh`}
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
              {students.slice(0, 6).map(s => {
                const cls = classes.find(c => c.id === s.classId)
                return (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-navy-50 transition-colors cursor-pointer" onClick={() => onNavigate('students')}>
                    <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-semibold text-sm shrink-0">
                      {s.name.split(' ').pop()?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-navy-800 truncate">{s.name}</div>
                      <div className="text-xs text-navy-400">{s.grade}</div>
                    </div>
                    {cls && <Badge variant="navy">{cls.name}</Badge>}
                  </div>
                )
              })}
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
              {classes.map(cls => {
                const count = students.filter(s => s.classId === cls.id).length
                return (
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
                    <span className="text-sm font-semibold text-navy-600">{count} HS</span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="text-sm font-semibold text-navy-600 uppercase tracking-wide mb-3">Thao Tác Nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Điểm Danh Hôm Nay', icon: CalendarIcon, page: 'attendance', accent: 'bg-navy-800 text-white' },
            { label: 'Nhập Học Phí',       icon: BookIcon,     page: 'fees',       accent: 'bg-emerald-700 text-white' },
            { label: 'Nhận Xét HS',        icon: StarIcon,     page: 'reviews',    accent: 'bg-amber-600 text-white' },
            { label: 'Xem Lịch Dạy',       icon: ClockIcon,    page: 'schedule',   accent: 'bg-navy-600 text-white' },
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

const CalendarIcon = () => <Calendar size={18} />
const BookIcon     = () => <BookOpen  size={18} />
const StarIcon     = () => <TrendingUp size={18} />
const ClockIcon    = () => <Clock size={18} />
