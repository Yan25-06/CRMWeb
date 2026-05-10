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
    {label && <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">{label}</label>}
    <input className={clsx('input', error && 'border-red-400 focus:border-red-500 focus:ring-red-100', className)} {...props} />
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
)

// ─── Select ──────────────────────────────────────────────
export const Select = ({ label, error, className, children, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-navy-600 uppercase tracking-wide">{label}</label>}
    <select className={clsx('select', error && 'border-red-400', className)} {...props}>
      {children}
    </select>
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
)

// ─── Modal ───────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-box">
        <div className="modal-header flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost btn-sm rounded-lg p-1.5">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

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
let _toastSetState = null
export const setToastState = (fn) => { _toastSetState = fn }

export const toast = {
  success: (msg) => _toastSetState?.({ msg, type: 'success' }),
  error:   (msg) => _toastSetState?.({ msg, type: 'error' }),
  info:    (msg) => _toastSetState?.({ msg, type: 'info' }),
}

export const ToastContainer = () => {
  const [item, setItem] = React.useState(null)
  setToastState((t) => {
    setItem(t)
    setTimeout(() => setItem(null), 3000)
  })
  if (!item) return null
  const icons = {
    success: <CheckCircle size={16} className="text-emerald-600 shrink-0" />,
    error:   <AlertCircle size={16} className="text-red-500 shrink-0" />,
    info:    <Info        size={16} className="text-navy-500 shrink-0" />,
  }
  const cls = { success: 'toast-success', error: 'toast-error', info: 'toast-info' }
  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <div className={cls[item.type]}>
        {icons[item.type]}
        <span>{item.msg}</span>
        <button onClick={() => setItem(null)} className="ml-auto text-inherit opacity-50 hover:opacity-100">
          <X size={14} />
        </button>
      </div>
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

// need React import for ToastContainer
import React from 'react'
