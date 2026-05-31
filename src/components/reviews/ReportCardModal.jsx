import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { X, Download, FileImage, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { buildTagSummary, POSITIVE_TAGS } from './QuickTagEditor'

const SKILL_LABELS = [
  { key: 'listenScore', label: 'Nghe (Listening)' },
  { key: 'speakScore',  label: 'Nói (Speaking)'   },
  { key: 'readScore',   label: 'Đọc (Reading)'    },
  { key: 'writeScore',  label: 'Viết (Writing)'   },
]

const fmtDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

/**
 * ReportCardModal — preview and export a professional report card
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Object}   student    - student object
 * @param {Object}   cls        - class object
 * @param {Object}   latestReview - the review to export (most recent)
 * @param {Object}   settings   - { centerName, teacherName }
 */
export const ReportCardModal = ({ open, onClose, student, cls, latestReview, settings = {} }) => {
  const cardRef  = useRef(null)
  const [loading, setLoading] = useState(null) // 'png' | 'pdf' | null

  if (!open) return null

  const hasReview = !!latestReview
  const tagSummary = hasReview ? buildTagSummary(latestReview?.tags ?? []) : ''

  const exportAs = async (type) => {
    if (!cardRef.current || !hasReview) return
    setLoading(type)
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, logging: false })

      const studentName = student?.name ?? 'hoc-vien'
      const dateStr = new Date().toISOString().split('T')[0]
      const filename = `phieu-nhan-xet-${studentName.replace(/\s+/g, '-')}-${dateStr}`

      if (type === 'png') {
        const link = document.createElement('a')
        link.download = `${filename}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } else {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const pageW = pdf.internal.pageSize.getWidth()
        const imgH  = (canvas.height * pageW) / canvas.width
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH)
        pdf.save(`${filename}.pdf`)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
          <p className="font-semibold text-navy-900">Phiếu Kết Quả Học Viên</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Report card preview */}
        <div className="p-5 overflow-y-auto max-h-[70vh]">
          <div ref={cardRef} className="bg-white border-2 border-navy-200 rounded-2xl overflow-hidden font-sans">

            {/* Header */}
            <div className="bg-gradient-to-br from-navy-900 to-navy-700 text-white px-6 py-5">
              <p className="text-xl font-bold tracking-wide">{settings.centerName || 'Trung Tâm Anh Ngữ'}</p>
              <p className="text-sm opacity-70 mt-0.5">PHIẾU NHẬN XÉT HỌC VIÊN</p>
            </div>

            {/* Student info */}
            <div className="px-6 py-4 bg-navy-50 border-b border-navy-100">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div><span className="font-semibold text-navy-600">Họ và tên:</span> <span className="text-navy-900">{student?.name ?? '—'}</span></div>
                <div><span className="font-semibold text-navy-600">Lớp:</span> <span className="text-navy-900">{cls?.name ?? '—'}</span></div>
                <div><span className="font-semibold text-navy-600">Ngày đánh giá:</span> <span className="text-navy-900">{fmtDate(latestReview?.date)}</span></div>
                <div><span className="font-semibold text-navy-600">Giáo viên:</span> <span className="text-navy-900">{latestReview?.teacherName || settings.teacherName || '—'}</span></div>
              </div>
            </div>

            {hasReview ? (
              <div className="px-6 py-4 flex flex-col gap-4">
                {/* Skill scores table */}
                <div>
                  <p className="text-xs font-bold text-navy-600 uppercase tracking-wide mb-2">Điểm Kỹ Năng</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SKILL_LABELS.map(({ key, label }) => {
                      const score = latestReview[key]
                      if (score == null) return null
                      const pct = Math.round((score / 9) * 100)
                      return (
                        <div key={key} className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-navy-600">{label}</span>
                            <span className="text-sm font-bold text-navy-800">{score}/9</span>
                          </div>
                          <div className="h-1.5 bg-navy-100 rounded-full overflow-hidden">
                            <div className="h-full bg-navy-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tags */}
                {latestReview.tags?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-navy-600 uppercase tracking-wide mb-2">Nhận Xét</p>
                    <div className="flex flex-wrap gap-1.5">
                      {latestReview.tags.map(t => (
                        <span key={t} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                          POSITIVE_TAGS.includes(t)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>{t}</span>
                      ))}
                    </div>
                    {tagSummary && <p className="text-xs text-navy-600 mt-1.5 italic">{tagSummary}</p>}
                  </div>
                )}

                {/* Remark */}
                {latestReview.remark && (
                  <div>
                    <p className="text-xs font-bold text-navy-600 uppercase tracking-wide mb-1">Ghi Chú</p>
                    <p className="text-sm text-navy-700">{latestReview.remark}</p>
                  </div>
                )}

                {/* Advice */}
                {latestReview.advice && (
                  <div className="bg-navy-50 border border-navy-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-navy-600 uppercase tracking-wide mb-1">💡 Lời Khuyên</p>
                    <p className="text-sm text-navy-700">{latestReview.advice}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-navy-100 pt-3 flex justify-between text-xs text-navy-400">
                  <span>Ngày lập: {new Date().toLocaleDateString('vi-VN')}</span>
                  <span>Giáo viên: {latestReview.teacherName || settings.teacherName || '—'}</span>
                </div>
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-navy-400">
                <p>Chưa có dữ liệu đánh giá để xuất phiếu.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-navy-100">
          <Button variant="secondary" size="sm" onClick={onClose}>Đóng</Button>
          <Button
            variant="secondary" size="sm"
            disabled={!hasReview || loading === 'png'}
            onClick={() => exportAs('png')}
            className="flex items-center gap-1.5"
            title={!hasReview ? 'Cần tạo đánh giá trước khi xuất phiếu' : undefined}
          >
            {loading === 'png' ? <Loader2 size={14} className="animate-spin" /> : <FileImage size={14} />}
            Tải Ảnh
          </Button>
          <Button
            variant="primary" size="sm"
            disabled={!hasReview || loading === 'pdf'}
            onClick={() => exportAs('pdf')}
            className="flex items-center gap-1.5"
            title={!hasReview ? 'Cần tạo đánh giá trước khi xuất phiếu' : undefined}
          >
            {loading === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Tải PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
