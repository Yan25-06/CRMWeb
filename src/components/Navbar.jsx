import { clsx } from 'clsx'
import {
  LayoutDashboard, CalendarCheck, BookOpen,
  Calendar, Users, Settings, Menu, X, Download, Upload,
  GraduationCap,
} from 'lucide-react'
import { useState } from 'react'
import { exportData } from '@/store/db'
import { toast } from '@/components/ui'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'attendance', label: 'Điểm Danh', icon: CalendarCheck },
  { id: 'fees', label: 'Học Phí', icon: BookOpen },
  { id: 'reviews', label: 'Nhận Xét', icon: GraduationCap },
  { id: 'schedule', label: 'Lịch Dạy', icon: Calendar },
  { id: 'classes', label: 'Lớp Học', icon: Users },
]

export const Navbar = ({ activePage, onNavigate, centerName }) => {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleExport = () => {
    exportData()
    toast.success('Đã xuất file backup!')
  }

  return (
    <>
      {/* ─── Desktop sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-1/5 shrink-0 bg-navy-900 h-screen sticky top-0 overflow-y-auto">
        {/* Logo */}
        <div className="px-6 py-8">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
              <GraduationCap size={20} strokeWidth={2} />
            </div>
            <span className="font-display text-white font-bold text-xl leading-[1.1] tracking-tight">
              {centerName || 'Anh Ngữ Ms.Phương'}
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left',
                activePage === id
                  ? 'bg-white/15 text-white'
                  : 'text-navy-300 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-navy-800 flex flex-col gap-1">
          <button
            onClick={handleExport}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navy-400 hover:text-white hover:bg-white/8 transition-all duration-200 w-full"
          >
            <Download size={16} />
            Xuất Backup
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full',
              activePage === 'settings'
                ? 'bg-white/15 text-white'
                : 'text-navy-400 hover:text-white hover:bg-white/8'
            )}
          >
            <Settings size={16} />
            Cài Đặt
          </button>
        </div>
      </aside>

      {/* ─── Mobile top bar ─── */}
      <header className="lg:hidden bg-navy-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-navy">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
            <GraduationCap size={20} strokeWidth={2} />
          </div>
          <span className="font-display text-white font-bold text-base leading-[1.1] tracking-tight">
            {centerName || 'Anh Ngữ Ms.Phương'}
          </span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" />
          <div
            className="absolute top-0 left-0 w-64 h-full bg-navy-900 flex flex-col shadow-navy-xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-6 border-b border-navy-800 flex items-center justify-between">
              <span className="text-white font-semibold">{centerName || 'Anh Ngữ Ms.Phương'}</span>
              <button onClick={() => setMenuOpen(false)} className="text-navy-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
              {[...NAV_ITEMS, { id: 'settings', label: 'Cài Đặt', icon: Settings }].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { onNavigate(id); setMenuOpen(false) }}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all w-full text-left',
                    activePage === id ? 'bg-white/15 text-white' : 'text-navy-300 hover:bg-white/8 hover:text-white'
                  )}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-navy-100 flex">
        {NAV_ITEMS.slice(0, 5).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={clsx(
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              activePage === id ? 'text-navy-800' : 'text-navy-400'
            )}
          >
            <Icon size={19} strokeWidth={activePage === id ? 2.2 : 1.8} />
            {label}
          </button>
        ))}
      </nav>
    </>
  )
}
