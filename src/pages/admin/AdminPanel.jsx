import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getTeachers, inviteTeacher, getTeacherOverview } from '@/services/teacherService'
import { getClasses, addClass } from '@/services/classService'
import { toast } from '@/components/ui'
import { UserPlus, Users, BookOpen, ShieldCheck, Eye } from 'lucide-react'
import { clsx } from 'clsx'

// ── Invite Form ─────────────────────────────────────────────

function InviteTeacherForm({ onSuccess }) {
  const [email, setEmail]         = useState('')
  const [name, setName]           = useState('')
  const [tempPassword, setTempPw] = useState('')
  const [loading, setLoading]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (tempPassword.length < 8) { toast.error('Mật khẩu tạm phải có ít nhất 8 ký tự'); return }
    setLoading(true)
    try {
      await inviteTeacher(email, name, tempPassword)
      toast.success(`Đã tạo tài khoản cho ${name}. Báo mật khẩu tạm qua Zalo/điện thoại.`)
      setEmail(''); setName(''); setTempPw('')
      onSuccess?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text" required placeholder="Tên giáo viên" value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
        />
        <input
          type="email" required placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
        />
      </div>
      <div className="flex gap-3">
        <input
          type="text" required placeholder="Mật khẩu tạm (ít nhất 8 ký tự)" value={tempPassword}
          onChange={e => setTempPw(e.target.value)}
          className="flex-1 px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-400"
        />
        <button type="submit" disabled={loading}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition shrink-0',
            loading ? 'bg-navy-400 cursor-not-allowed' : 'bg-navy-800 hover:bg-navy-700'
          )}>
          <UserPlus size={15} />
          {loading ? 'Đang tạo...' : 'Tạo Tài Khoản'}
        </button>
      </div>
      <p className="text-xs text-navy-400">Sau khi tạo, báo mật khẩu tạm cho giáo viên qua Zalo/điện thoại. Họ có thể đổi mật khẩu qua "Quên mật khẩu".</p>
    </form>
  )
}

// ── Assign Class Form ────────────────────────────────────────

function AssignClassForm({ teachers, onSuccess }) {
  const [form, setForm]     = useState({ name: '', level: '', courseType: '', teacherId: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.teacherId) { toast.error('Chọn giáo viên phụ trách'); return }
    setLoading(true)
    try {
      await addClass({ name: form.name, level: form.level, courseType: form.courseType, teacherId: form.teacherId })
      toast.success(`Đã tạo lớp "${form.name}"`)
      setForm({ name: '', level: '', courseType: '', teacherId: '' })
      onSuccess?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input required placeholder="Tên lớp *" value={form.name} onChange={set('name')}
        className="px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-400" />
      <input placeholder="Trình độ (vd: B2, 6.0+)" value={form.level} onChange={set('level')}
        className="px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-400" />
      <input placeholder="Loại khóa (IELTS, TOEIC...)" value={form.courseType} onChange={set('courseType')}
        className="px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-400" />
      <select required value={form.teacherId} onChange={set('teacherId')}
        className="px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white">
        <option value="">-- Giao cho giáo viên *</option>
        {teachers.filter(t => !t.isAdmin).map(t => (
          <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
        ))}
      </select>
      <div className="sm:col-span-2">
        <button type="submit" disabled={loading}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition',
            loading ? 'bg-navy-400 cursor-not-allowed' : 'bg-navy-800 hover:bg-navy-700'
          )}>
          <BookOpen size={15} />
          {loading ? 'Đang tạo...' : 'Tạo & Giao Lớp'}
        </button>
      </div>
    </form>
  )
}

// ── Teacher Row ──────────────────────────────────────────────

function TeacherRow({ teacher }) {
  const [overview, setOverview] = useState(null)

  useEffect(() => {
    getTeacherOverview(teacher.id).then(setOverview)
  }, [teacher.id])

  return (
    <div className="flex items-center gap-4 py-3 px-4 bg-white rounded-xl border border-navy-100">
      <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-sm shrink-0">
        {teacher.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy-800 truncate">{teacher.name}</p>
        <p className="text-xs text-navy-400 truncate">{teacher.email}</p>
      </div>
      {overview && (
        <div className="flex gap-4 text-xs text-navy-500 shrink-0">
          <span><strong className="text-navy-800">{overview.classCount}</strong> lớp</span>
          <span><strong className="text-navy-800">{overview.studentCount}</strong> học sinh</span>
        </div>
      )}
      {teacher.isAdmin && (
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Admin</span>
      )}
    </div>
  )
}

// ── Main AdminPanel ──────────────────────────────────────────

export function AdminPanel() {
  const { teacher } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses]   = useState([])
  const [tab, setTab]           = useState('teachers')
  const [loading, setLoading]   = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [t, c] = await Promise.all([getTeachers(), getClasses()])
      setTeachers(t); setClasses(c)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  if (!teacher?.isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-navy-400">Bạn không có quyền truy cập trang này.</p>
      </div>
    )
  }

  const TABS = [
    { id: 'teachers', label: 'Giáo Viên', icon: Users },
    { id: 'classes',  label: 'Lớp Học',   icon: BookOpen },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy-800">Quản Lý Trung Tâm</h1>
          <p className="text-sm text-navy-400">Chỉ dành cho Admin — chế độ xem read-only</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-navy-100">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px',
              tab === id ? 'border-navy-800 text-navy-800' : 'border-transparent text-navy-400 hover:text-navy-700'
            )}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'teachers' && (
        <div className="space-y-6">
          {/* Invite section */}
          <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-navy-700 flex items-center gap-2">
              <UserPlus size={15} /> Mời Giáo Viên Mới
            </h2>
            <InviteTeacherForm onSuccess={loadData} />
          </div>

          {/* Teacher list */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-navy-600">
              Danh sách giáo viên ({teachers.length})
            </h2>
            {loading ? (
              <p className="text-sm text-navy-400 py-4 text-center">Đang tải...</p>
            ) : teachers.length === 0 ? (
              <p className="text-sm text-navy-400 py-4 text-center">Chưa có giáo viên nào</p>
            ) : (
              teachers.map(t => <TeacherRow key={t.id} teacher={t} />)
            )}
          </div>
        </div>
      )}

      {tab === 'classes' && (
        <div className="space-y-6">
          {/* Create class section */}
          <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-navy-700 flex items-center gap-2">
              <BookOpen size={15} /> Tạo Lớp Mới
            </h2>
            <AssignClassForm teachers={teachers} onSuccess={loadData} />
          </div>

          {/* Class list — read-only */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-navy-600">
              Tất cả lớp học ({classes.length}) — <span className="text-navy-400 font-normal">xem read-only</span>
            </h2>
            {loading ? (
              <p className="text-sm text-navy-400 py-4 text-center">Đang tải...</p>
            ) : classes.length === 0 ? (
              <p className="text-sm text-navy-400 py-4 text-center">Chưa có lớp nào</p>
            ) : (
              <div className="space-y-2">
                {classes.map(cls => {
                  const teacher = teachers.find(t => t.id === cls.teacherId)
                  return (
                    <div key={cls.id} className="flex items-center gap-4 py-3 px-4 bg-white rounded-xl border border-navy-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-navy-800">{cls.name}</p>
                        <p className="text-xs text-navy-400">{cls.courseType} {cls.level && `· ${cls.level}`}</p>
                      </div>
                      {teacher && (
                        <span className="text-xs text-navy-500 shrink-0">{teacher.name}</span>
                      )}
                      <Eye size={14} className="text-navy-300 shrink-0" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
