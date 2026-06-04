import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GraduationCap } from 'lucide-react'

export function SetPasswordPage({ onDone }) {
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!displayName.trim()) {
      setError('Vui lòng nhập tên hiển thị.')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
      setTimeout(() => onDone?.(displayName.trim()), 1500)
    } catch (err) {
      setError('Không thể đặt mật khẩu. Liên kết có thể đã hết hạn — vui lòng liên hệ admin để được mời lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-full bg-navy-900 flex items-center justify-center text-blue-400">
            <GraduationCap size={28} strokeWidth={2} />
          </div>
          <h1 className="font-display text-navy-900 font-bold text-2xl tracking-tight">
            Đặt mật khẩu
          </h1>
          <p className="text-navy-400 text-sm text-center">
            Chào mừng! Vui lòng đặt mật khẩu để kích hoạt tài khoản.
          </p>
        </div>

        {success ? (
          <div className="bg-white rounded-2xl shadow-navy-sm border border-navy-100 p-6 text-center text-green-600 font-medium">
            Tài khoản đã được kích hoạt! Đang chuyển hướng…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-navy-sm border border-navy-100 p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-navy-700">Tên hiển thị</label>
              <input
                type="text"
                required
                autoComplete="name"
                autoFocus
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="VD: Nguyễn Thị Phương"
                className="border border-navy-200 rounded-xl px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-navy-700">Mật khẩu mới</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="border border-navy-200 rounded-xl px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-navy-700">Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="border border-navy-200 rounded-xl px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 bg-navy-900 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-navy-800 transition disabled:opacity-60"
            >
              {loading ? 'Đang lưu…' : 'Xác nhận mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
