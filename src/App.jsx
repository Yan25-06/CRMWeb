import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SetPasswordPage } from '@/pages/auth/SetPasswordPage'
import { Navbar } from '@/components/layout/Navbar'
import { ToastContainer } from '@/components/ui'
import { DashboardPage } from '@/pages/DashboardPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ReviewsPage } from '@/pages/ReviewsPage'
import { SchedulePage } from '@/pages/SchedulePage'
import { FeesPage } from '@/pages/FeesPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { ClassesOverviewPage } from '@/pages/ClassesOverviewPage'
import { ClassDetailPage } from '@/pages/ClassDetailPage'
import { AdminPanel } from '@/pages/admin/AdminPanel'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'

const MONTHS = ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12']

function AppShell() {
  const { user, teacher, loading } = useAuth()
  const [page, setPage]   = useState('dashboard')
  const [year, setYear]   = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [selectedClassId, setSelectedClassId] = useState(null)

  // Detect Supabase password-reset / invite token in URL hash
  const [needsSetPassword, setNeedsSetPassword] = useState(() => {
    const hash = window.location.hash
    return hash.includes('type=invite') || hash.includes('type=recovery')
  })

  // Clear hash after detecting token so refresh doesn't retrigger
  useEffect(() => {
    if (needsSetPassword) window.history.replaceState(null, '', window.location.pathname)
  }, [needsSetPassword])

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Supabase sends the user to this page after invite/reset — handle before auth check
  if (needsSetPassword && user) {
    return <SetPasswordPage onDone={() => setNeedsSetPassword(false)} />
  }

  if (!user) return <LoginPage />

  const centerName = teacher?.name || 'Anh Ngữ Ms.Phương'

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const pagesWithMonthPicker = ['dashboard', 'fees']
  const showPicker = pagesWithMonthPicker.includes(page)

  const renderPage = () => {
    if (page === 'admin' && teacher?.isAdmin) return <AdminPanel />

    switch (page) {
      case 'dashboard': return <DashboardPage year={year} month={month} onNavigate={setPage} />
      case 'fees':      return <FeesPage year={year} month={month} />
      case 'reports':   return <ReportsPage />
      case 'reviews':   return <ReviewsPage />
      case 'schedule':  return <SchedulePage onNavigate={setPage} />
      case 'classes':
        if (selectedClassId) {
          return <ClassDetailPage classId={selectedClassId} onBack={() => setSelectedClassId(null)} />
        }
        return <ClassesOverviewPage onSelectClass={setSelectedClassId} />
      case 'settings':  return <SettingsPage />
      default:          return <DashboardPage year={year} month={month} onNavigate={setPage} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      <Navbar
        activePage={page}
        onNavigate={setPage}
        centerName={centerName}
        isAdmin={teacher?.isAdmin}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="bg-white border-b border-navy-100 px-6 py-3 flex items-center justify-between sticky top-0 lg:top-0 z-20 shadow-navy-sm">
          <div className="flex items-center gap-3">
            {showPicker && (
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-0.5">
                  {MONTHS.map((m, i) => (
                    <button key={i} onClick={() => setMonth(i + 1)}
                      className={clsx(
                        'px-2 py-1 rounded-lg text-xs font-medium transition-all hidden sm:block',
                        month === i + 1 ? 'bg-navy-800 text-white' : 'text-navy-400 hover:text-navy-700 hover:bg-navy-50'
                      )}>
                      {m}
                    </button>
                  ))}
                  <span className="sm:hidden text-sm font-semibold text-navy-800 px-2">
                    Tháng {month}/{year}
                  </span>
                </div>
                <button onClick={nextMonth} className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {showPicker && (
            <div className="flex items-center gap-1.5">
              {[year - 1, year, year + 1].map(y => (
                <button key={y} onClick={() => setYear(y)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                    year === y ? 'bg-navy-100 text-navy-800 font-semibold' : 'text-navy-400 hover:bg-navy-50 hover:text-navy-700'
                  )}>
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {renderPage()}
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
