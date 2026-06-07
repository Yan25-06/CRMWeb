import React, { useEffect, useRef, useId } from 'react'
export { CurrencyInput } from './CurrencyInput'
import { clsx } from 'clsx'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

// ─── Button ──────────────────────────────────────────────
export const Button = ({
  children, variant = 'primary', size = 'md',
  className, disabled, onClick, type = 'button', ...props
}) => {
  const base   = 'btn'
  const sizes  = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' }
  const vars   = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    danger:    'btn-danger',
    success:   'btn-success',
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(base, sizes[size], vars[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── Badge ───────────────────────────────────────────────
export const Badge = ({ children, variant = 'navy', className }) => {
  const vars = {
    navy: 'badge-navy', success: 'badge-success',
    warning: 'badge-warning', danger: 'badge-danger', gray: 'badge-gray',
  }
  return <span className={clsx(vars[variant], className)}>{children}</span>
}

// ─── Card ────────────────────────────────────────────────
export const Card = ({ children, className, onClick, navy }) => (
  <div
    onClick={onClick}
    className={clsx(navy ? 'card-navy' : 'card', onClick && 'cursor-pointer', className)}
  >
    {children}
  </div>
)

// ─── Input ───────────────────────────────────────────────
export const Input = ({ label, error, className, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-navy-700">{label}</label>}
    <input className={clsx('input', error && 'border-red-400 focus:border-red-500 focus:ring-red-100', className)} {...props} />
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
)

// ─── Select ──────────────────────────────────────────────
export const Select = ({ label, error, className, children, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-navy-700">{label}</label>}
    <select className={clsx('select', error && 'border-red-400', className)} {...props}>
      {children}
    </select>
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
)

// ─── Modal ───────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer }) => {
  const boxRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    const trapFocus = (e) => {
      const box = boxRef.current
      if (!box) return
      const focusables = box.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) { e.preventDefault(); box.focus(); return }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      else if (e.key === 'Tab') trapFocus(e)
    }

    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    boxRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div
        className="modal-box"
        ref={boxRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-header flex items-center justify-between">
          <h2 id={titleId} className="text-base font-semibold text-navy-900">{title}</h2>
          <button onClick={onClose} aria-label="Đóng" className="btn-ghost btn-sm rounded-lg p-1.5">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ─── ConfirmModal ─────────────────────────────────────────
export const ConfirmModal = ({ open, onClose, onConfirm, title = 'Xác nhận', message, confirmLabel = 'Xác nhận', variant = 'danger' }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    footer={
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </div>
    }
  >
    <p className="text-sm text-navy-700">{message}</p>
  </Modal>
)

// ─── Stat Card ───────────────────────────────────────────
export const StatCard = ({ label, value, sub, icon, accent, className }) => (
  <div className={clsx('stat-card', className)}>
    <div className="flex items-start justify-between">
      <span className="stat-label">{label}</span>
      {icon && (
        <span className={clsx(
          'flex items-center justify-center w-8 h-8 rounded-xl text-base',
          accent === 'navy'    && 'bg-navy-100 text-navy-700',
          accent === 'success' && 'bg-emerald-100 text-emerald-700',
          accent === 'warning' && 'bg-amber-100 text-amber-700',
          accent === 'danger'  && 'bg-red-100 text-red-600',
          !accent              && 'bg-navy-50 text-navy-500',
        )}>
          {icon}
        </span>
      )}
    </div>
    <span className="stat-value">{value}</span>
    {sub && <span className="stat-sub">{sub}</span>}
  </div>
)

// ─── Toast ───────────────────────────────────────────────
// Đăng ký push callback (gắn trong useEffect của ToastContainer, không gọi khi render).
let _pushToast = null
export const setToastPush = (fn) => { _pushToast = fn }

let _toastId = 0
const emit = (msg, type) => _pushToast?.({ id: ++_toastId, msg, type })
export const toast = {
  success: (msg) => emit(msg, 'success'),
  error:   (msg) => emit(msg, 'error'),
  info:    (msg) => emit(msg, 'info'),
}

export const ToastContainer = () => {
  const [items, setItems] = React.useState([])

  useEffect(() => {
    setToastPush((t) => {
      setItems(prev => [...prev, t])
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== t.id)), 3000)
    })
    return () => setToastPush(null)
  }, [])

  if (items.length === 0) return null
  const icons = {
    success: <CheckCircle size={16} className="text-emerald-600 shrink-0" />,
    error:   <AlertCircle size={16} className="text-red-500 shrink-0" />,
    info:    <Info        size={16} className="text-navy-500 shrink-0" />,
  }
  const cls = { success: 'toast-success', error: 'toast-error', info: 'toast-info' }
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end" aria-live="polite">
      {items.map(item => (
        <div key={item.id} role="alert" className={cls[item.type]}>
          {icons[item.type]}
          <span>{item.msg}</span>
          <button
            onClick={() => setItems(prev => prev.filter(x => x.id !== item.id))}
            aria-label="Đóng"
            className="ml-auto text-inherit opacity-50 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────
export const Skeleton = ({ className }) => (
  <div className={clsx('skeleton', className)} />
)

// ─── Empty state ─────────────────────────────────────────
export const Empty = ({ icon, title, desc, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    {icon && <div className="text-4xl opacity-30">{icon}</div>}
    <p className="font-medium text-navy-700">{title}</p>
    {desc && <p className="text-sm text-navy-400">{desc}</p>}
    {action}
  </div>
)
