import { useState, useEffect } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Giữ DOM sống thêm `duration` ms sau khi isOpen chuyển sang false, để kịp chạy
 * exit animation. Trả về true khi còn phải render.
 *
 * Với người bật prefers-reduced-motion, CSS đã rút animation về 0.01ms nhưng
 * setTimeout thì không — nên phải tự đọc matchMedia và bỏ hẳn độ trễ, nếu không
 * overlay vô hình sẽ chặn click thêm một phần tư giây với đúng nhóm người dùng
 * mà thiết lập đó định bảo vệ.
 */
export const useMountTransition = (isOpen, duration = 240) => {
  const [mounted, setMounted] = useState(isOpen)

  useEffect(() => {
    if (isOpen) { setMounted(true); return }
    const delay = prefersReducedMotion() ? 0 : duration
    const t = setTimeout(() => setMounted(false), delay)
    return () => clearTimeout(t)
  }, [isOpen, duration])

  return mounted
}
