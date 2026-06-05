import { useState } from 'react'
import { FileText } from 'lucide-react'
import { toast } from '@/components/ui'

export const ExportPdfButton = ({ targetRef, filename, disabled }) => {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!targetRef?.current || disabled) return
    setLoading(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(targetRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      const date = new Date().toISOString().split('T')[0]
      pdf.save(`${filename}-${date}.pdf`)
    } catch (e) {
      console.error('PDF export failed:', e)
      toast.error('Xuất PDF thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      title={disabled ? 'Chưa có dữ liệu để xuất' : 'Xuất PDF'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <FileText size={14} />
      {loading ? 'Đang xuất...' : 'PDF'}
    </button>
  )
}
