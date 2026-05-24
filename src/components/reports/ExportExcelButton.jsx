import { useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'

export const ExportExcelButton = ({ rows, columns, filename, disabled }) => {
  const [loading, setLoading] = useState(false)

  const handleClick = () => {
    if (!rows?.length || disabled) return
    setLoading(true)
    try {
      const header = columns.map(c => c.label)
      const data = rows.map(row => columns.map(c => row[c.key] ?? ''))
      const ws = XLSX.utils.aoa_to_sheet([header, ...data])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Dữ liệu')
      const date = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `${filename}-${date}.xlsx`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !rows?.length || loading}
      title={!rows?.length ? 'Chưa có dữ liệu để xuất' : 'Xuất Excel'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <FileSpreadsheet size={14} />
      Excel
    </button>
  )
}
