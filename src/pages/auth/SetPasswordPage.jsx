import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'

// Handles both: first-time invite setup AND forgot-password reset.
// Supabase redirects to this page with a token in the URL hash.
export function SetPasswordPage({ onDone }) {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự'); return }
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp'); return }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) setError(err.message)
    else { setSuccess(true); setTimeout(() => onDone?.(), 1500) }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-400">
            <GraduationCap size={32} strokeWidth={1.8} />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Đặt mật khẩu</h1>
          <p className="text-navy-400 text-sm text-center">
            {success ? 'Mật khẩu đã được đặt thành công!' : 'Tạo mật khẩu mới cho tài khoản của bạn'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <p className="text-center text-green-700 font-medium">Đang chuyển hướng...</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-navy-700">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full px-4 py-2.5 pr-10 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 transition"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-navy-700">Xác nhận mật khẩu</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full px-4 py-2.5 border border-navy-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-400 transition"
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button type="submit" disabled={loading}
                className={clsx(
                  'w-full py-2.5 rounded-xl text-sm font-semibold text-white transition',
                  loading ? 'bg-navy-400 cursor-not-allowed' : 'bg-navy-800 hover:bg-navy-700'
                )}>
                {loading ? 'Đang lưu...' : 'Xác nhận mật khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
