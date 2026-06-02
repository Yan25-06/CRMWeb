import { Modal, Badge } from '@/components/ui'
import { fmtVND, fmtDate } from '@/utils/helpers'
import { Banknote, ArrowLeftRight, Trash2 } from 'lucide-react'
import { deletePayment } from '@/services/paymentService'
import { toast } from '@/components/ui'

const METHOD_LABEL = { cash: 'Tiền mặt', transfer: 'Chuyển khoản' }

export const StudentPaymentHistoryPanel = ({ open, onClose, student, payments, onDeleted }) => {
  const handleDelete = async (id) => {
    if (!confirm('Xoá khoản thanh toán này?')) return
    await deletePayment(id)
    toast.success('Đã xoá')
    onDeleted?.()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Lịch sử thanh toán — ${student?.name ?? ''}`}>
      {payments.length === 0 ? (
        <p className="text-sm text-navy-400 py-6 text-center">Chưa có khoản nào</p>
      ) : (
        <div className="flex flex-col divide-y divide-navy-50 max-h-96 overflow-y-auto">
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between py-3 gap-3">
              <div className="flex items-center gap-2 shrink-0">
                {p.method === 'cash'
                  ? <Banknote size={15} className="text-emerald-600" />
                  : <ArrowLeftRight size={15} className="text-blue-500" />
                }
                <span className="text-xs text-navy-400">{METHOD_LABEL[p.method]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy-900">{fmtVND(p.amount)}</p>
                <p className="text-xs text-navy-400">
                  {fmtDate(p.paidAt)} · Tháng {p.period?.replace('-', '/')}
                  {p.note ? ` · ${p.note}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="p-1.5 rounded-lg text-navy-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
