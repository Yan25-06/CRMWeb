import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'

export function LoginPage() {
  const { login, resetPassword } = useAuth()
  const [mode, setMode] = useState('login')   // 'login' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error: err } = await login(email, password)
    setLoading(false)
    if (err) setError(err.message === 'Invalid login credentials'
      ? 'Email hoặc mật khẩu không đúng'
      : err.message)
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error: err } = await resetPassword(email)
    setLoading(false)
    if (err) setError(err.message)
    else setMessage('Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.')
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <GraduationCap size={32} strokeWidth={1.8} />
          </div>
          <h1 className="text-navy-900 text-2xl font-bold tracking-tight">Anh Ngữ Ms.Phương</h1>
          <p className="text-navy-500 text-sm">
            {mode === 'login' ? 'Đăng nhập vào tài khoản của bạn' : 'Đặt lại mật khẩu'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-navy-100 rounded-2xl shadow-lg p-8">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-navy-700">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="teacher@example.com"
                  className="w-full px-4 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-900 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-navy-700">Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-10 border border-navy-200 rounded-xl text-sm text-navy-900 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setMessage('') }}
                  className="self-end text-xs text-navy-400 hover:text-navy-600 underline"
                >
                  Quên mật khẩu?
                </button>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  'w-full py-2.5 rounded-xl text-sm font-semibold text-white transition',
                  loading ? 'bg-navy-300 cursor-not-allowed' : 'bg-navy-800 hover:bg-navy-700'
                )}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-navy-700">Email tài khoản</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="teacher@example.com"
                  className="w-full px-4 py-2.5 border border-navy-200 rounded-xl text-sm text-navy-900 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 transition"
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
              {message && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  'w-full py-2.5 rounded-xl text-sm font-semibold text-white transition',
                  loading ? 'bg-navy-300 cursor-not-allowed' : 'bg-navy-800 hover:bg-navy-700'
                )}
              >
                {loading ? 'Đang gửi...' : 'Gửi email đặt lại mật khẩu'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setMessage('') }}
                className="text-sm text-navy-500 hover:text-navy-700 underline text-center"
              >
                Quay lại đăng nhập
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
