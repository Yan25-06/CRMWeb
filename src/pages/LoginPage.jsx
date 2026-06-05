import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import logoStacked from '/logo-stacked-color.png'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const { login, requestPasswordReset } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!EMAIL_RE.test(email)) {
      setError('Vui lòng nhập email hợp lệ.')
      return
    }
    setLoading(true)
    try {
      await requestPasswordReset(email)
    } catch {
      // Không tiết lộ lỗi cụ thể để tránh dò tài khoản — vẫn báo xác nhận chung.
    } finally {
      setLoading(false)
      setInfo('Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.')
    }
  }

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setInfo('')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <img src={logoStacked} alt="Anh Ngữ Ms.Phương" className="h-28 w-auto object-contain" />
          <p className="text-navy-400 text-sm">
            {mode === 'login' ? 'Đăng nhập để tiếp tục' : 'Khôi phục mật khẩu'}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={mode === 'login' ? handleSubmit : handleReset}
          className="bg-white rounded-2xl shadow-navy-sm border border-navy-100 p-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-navy-700">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="border border-navy-200 rounded-xl px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition"
            />
          </div>

          {mode === 'login' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-navy-700">Mật khẩu</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border border-navy-200 rounded-xl px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition"
              />
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {info && (
            <p className="text-navy-700 text-sm bg-navy-50 border border-navy-100 rounded-xl px-3 py-2">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-navy-900 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-navy-800 transition disabled:opacity-60"
          >
            {mode === 'login'
              ? (loading ? 'Đang đăng nhập…' : 'Đăng nhập')
              : (loading ? 'Đang gửi…' : 'Gửi liên kết đặt lại')}
          </button>

          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="text-sm text-navy-500 hover:text-navy-800 transition self-center"
            >
              Quên mật khẩu?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-sm text-navy-500 hover:text-navy-800 transition self-center"
            >
              ← Quay lại đăng nhập
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
