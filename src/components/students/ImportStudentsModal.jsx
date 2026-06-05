import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { Modal, Button, Badge } from '@/components/ui'
import { studentService } from '@/services/studentService'
import { enrollmentService } from '@/services/enrollmentService'

const COLUMN_MAP = {
  'tên': 'name', 'name': 'name', 'họ và tên': 'name', 'họ tên': 'name',
  'khối': 'grade', 'grade': 'grade',
  'sđt': 'phone', 'phone': 'phone', 'số điện thoại': 'phone', 'điện thoại': 'phone',
  'email': 'email', 'e-mail': 'email',
}

function mapRow(raw) {
  const mapped = {}
  for (const [key, value] of Object.entries(raw)) {
    const normalKey = String(key).trim().toLowerCase()
    const field = COLUMN_MAP[normalKey]
    if (field) mapped[field] = String(value ?? '').trim()
  }
  return mapped
}

function validateRow(row) {
  const errors = []
  if (!row.name) errors.push('Thiếu tên')
  return { errors }
}

async function generateTemplate() {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet([
    ['Tên', 'Khối', 'SĐT', 'Email'],
    ['Nguyễn Văn A', 'Lớp 9', '0901234567', 'a@example.com'],
    ['Trần Thị B', 'Lớp 10', '0912345678', ''],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Học sinh')
  XLSX.writeFile(wb, 'mau_import_hoc_sinh.xlsx')
}

export const ImportStudentsModal = ({ open, onClose, onImportDone, classes = [] }) => {
  const [rows, setRows] = useState([])
  const [validations, setValidations] = useState([])
  const [fileError, setFileError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  // Enrollment options
  const [selectedClassId, setSelectedClassId] = useState('')
  const [feeType, setFeeType] = useState('monthly')
  const [feeAmount, setFeeAmount] = useState('')

  const reset = () => {
    setRows([])
    setValidations([])
    setFileError('')
    setResult(null)
    setImportProgress(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    reset()

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setFileError('Chỉ chấp nhận file .xlsx hoặc .xls')
      return
    }

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx')
        const wb = XLSX.read(evt.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })
        const mapped = raw.map(mapRow)
        setRows(mapped)
        setValidations(mapped.map(r => validateRow(r)))
      } catch {
        setFileError('Không đọc được file. Kiểm tra lại định dạng.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = async () => {
    const validRows = rows.filter((_, i) => validations[i]?.errors.length === 0)
    if (validRows.length === 0) return

    setImporting(true)
    setImportProgress(0)
    let success = 0
    let enrolled = 0
    let failed = 0

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      try {
        const created = await studentService.create({
          name: row.name,
          grade: row.grade || null,
          phone: row.phone || null,
          email: row.email || null,
        })
        success++

        if (selectedClassId) {
          try {
            await enrollmentService.upsert({
              studentId: created.id,
              classId: selectedClassId,
              status: 'active',
              feeType,
              monthlyFee: feeType === 'monthly' ? (Number(feeAmount) || 0) : null,
              courseFee: feeType === 'course' ? (Number(feeAmount) || 0) : null,
              enrolledAt: new Date().toISOString(),
            })
            enrolled++
          } catch {
            // student created but enrollment failed — count separately
          }
        }
      } catch {
        failed++
      }
      setImportProgress(i + 1)
    }

    setImporting(false)
    setResult({ success, enrolled, failed, withClass: !!selectedClassId })
    if (success > 0) onImportDone?.()
  }

  const validCount = validations.filter(v => v?.errors.length === 0).length
  const errorCount = validations.filter(v => v?.errors.length > 0).length
  const selectedClass = classes.find(c => c.id === selectedClassId)

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import học sinh từ Excel"
      footer={
        result ? (
          <div className="flex justify-end w-full">
            <Button variant="primary" onClick={handleClose}>Đóng</Button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <button
              onClick={generateTemplate}
              className="flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-900 font-medium transition-colors"
            >
              <Download size={14} />
              Tải file mẫu
            </button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose}>Hủy</Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={importing || validCount === 0}
              >
                {importing
                  ? `Đang import... ${importProgress}/${validCount}`
                  : `Import ${validCount} học sinh`}
              </Button>
            </div>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {/* Result state */}
        {result && (
          <div className="flex flex-col gap-3 items-center py-4 text-center">
            <CheckCircle size={40} className="text-emerald-500" />
            <p className="font-semibold text-navy-900">Import hoàn tất</p>
            <div className="flex flex-col gap-1 text-sm text-navy-600">
              <p>{result.success} học sinh đã được tạo{result.failed > 0 ? `, ${result.failed} lỗi` : ''}</p>
              {result.withClass && (
                <p className="text-emerald-700 font-medium">
                  {result.enrolled} học sinh đã được ghi danh vào lớp {selectedClass?.name}
                </p>
              )}
            </div>
          </div>
        )}

        {!result && (
          <>
            {/* Class enrollment section */}
            <div className="flex flex-col gap-3 p-3 bg-navy-50 rounded-xl">
              <p className="text-xs font-semibold text-navy-700 uppercase tracking-wide">Ghi danh vào lớp (tùy chọn)</p>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="select text-sm"
              >
                <option value="">— Chỉ tạo hồ sơ, không xếp lớp —</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {selectedClassId && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-navy-600 uppercase tracking-wide">Học phí mặc định</p>
                  <div className="flex gap-1 p-1 bg-white rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFeeType('monthly')}
                      className={clsx(
                        'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
                        feeType === 'monthly' ? 'bg-navy-800 text-white' : 'text-navy-500 hover:text-navy-700'
                      )}
                    >
                      Theo tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeeType('course')}
                      className={clsx(
                        'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
                        feeType === 'course' ? 'bg-navy-800 text-white' : 'text-navy-500 hover:text-navy-700'
                      )}
                    >
                      Theo khóa
                    </button>
                  </div>
                  <input
                    type="number"
                    value={feeAmount}
                    onChange={e => setFeeAmount(e.target.value)}
                    placeholder={feeType === 'monthly' ? 'Học phí tháng (VNĐ)' : 'Học phí cả khóa (VNĐ)'}
                    min="0"
                    step="10000"
                    className="input text-sm"
                  />
                </div>
              )}
            </div>

            {/* File input */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-navy-200 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-all"
            >
              <FileSpreadsheet size={28} className="text-navy-400" />
              <p className="text-sm text-navy-600 font-medium">Chọn file Excel (.xlsx)</p>
              <p className="text-xs text-navy-400">Cột cần có: Tên, Khối, SĐT, Email</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFile}
                className="hidden"
              />
            </div>

            {fileError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                {fileError}
              </div>
            )}

            {/* Preview */}
            {rows.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-navy-700">{rows.length} dòng đọc được</p>
                  <div className="flex gap-2">
                    {validCount > 0 && <Badge variant="success">{validCount} hợp lệ</Badge>}
                    {errorCount > 0 && <Badge variant="danger">{errorCount} lỗi</Badge>}
                  </div>
                </div>
                <div className="overflow-x-auto max-h-52 overflow-y-auto rounded-xl border border-navy-100">
                  <table className="w-full text-xs">
                    <thead className="bg-navy-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-navy-600">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-navy-600">Tên</th>
                        <th className="px-3 py-2 text-left font-semibold text-navy-600">Khối</th>
                        <th className="px-3 py-2 text-left font-semibold text-navy-600">SĐT</th>
                        <th className="px-3 py-2 text-left font-semibold text-navy-600">Email</th>
                        <th className="px-3 py-2 text-left font-semibold text-navy-600">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => {
                        const v = validations[i] || { errors: [] }
                        const hasError = v.errors.length > 0
                        return (
                          <tr key={i} className={clsx('border-t border-navy-50', hasError && 'bg-red-50')}>
                            <td className="px-3 py-2 text-navy-400">{i + 1}</td>
                            <td className="px-3 py-2 text-navy-800">{row.name || <span className="text-red-400 italic">trống</span>}</td>
                            <td className="px-3 py-2 text-navy-600">{row.grade || '—'}</td>
                            <td className="px-3 py-2 text-navy-600">{row.phone || '—'}</td>
                            <td className="px-3 py-2 text-navy-600">{row.email || '—'}</td>
                            <td className="px-3 py-2">
                              {hasError
                                ? <span className="text-red-600">{v.errors.join(', ')}</span>
                                : <span className="text-emerald-600">OK</span>
                              }
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {errorCount > 0 && (
                  <p className="text-xs text-navy-400">{errorCount} dòng lỗi sẽ bị bỏ qua khi import.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
