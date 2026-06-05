import { toast } from '@/components/ui'

const slugify = (str = '') =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export const exportMockTestExcel = async (mockTest, results = [], students = [], className = '') => {
  let XLSX
  try {
    XLSX = await import('xlsx')
  } catch {
    toast.error('Không tải được thư viện xuất Excel. Vui lòng thử lại.')
    return
  }
  const sections = mockTest.sections ?? []
  const maxTotal = sections.reduce((s, sec) => s + sec.maxScore, 0)

  const scoreHeader = ['Tên học viên', ...sections.map(s => `${s.name} (/${s.maxScore})`), 'Tổng', '%']
  const scoreRows = students.map(stu => {
    const result = results.find(r => r.studentId === stu.id)
    const scores = result?.scores ?? {}
    const total = result?.totalScore ?? 0
    const pct = maxTotal > 0 && total > 0 ? Math.round((total / maxTotal) * 100) : ''
    return [
      stu.name,
      ...sections.map(s => scores[s.id] !== undefined && scores[s.id] !== '' ? scores[s.id] : ''),
      total > 0 ? total : '',
      pct !== '' ? `${pct}%` : '',
    ]
  })
  const sheet1 = XLSX.utils.aoa_to_sheet([scoreHeader, ...scoreRows])

  const noteHeader = ['Tên học viên', 'Nhận xét giáo viên']
  const noteRows = students.map(stu => {
    const result = results.find(r => r.studentId === stu.id)
    return [stu.name, result?.teacherNote ?? '']
  })
  const sheet2 = XLSX.utils.aoa_to_sheet([noteHeader, ...noteRows])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet1, 'Điểm thi')
  XLSX.utils.book_append_sheet(wb, sheet2, 'Nhận xét GV')

  const dateStr = mockTest.date ? mockTest.date.replace(/-/g, '') : 'unknown'
  const fileName = `mocktest_${slugify(className)}_${slugify(mockTest.title)}_${dateStr}.xlsx`
  XLSX.writeFile(wb, fileName)
}

export const exportStudentResultText = (student, mockTest, result, centerName = '') => {
  const sections = mockTest.sections ?? []
  const maxTotal = sections.reduce((s, sec) => s + sec.maxScore, 0)
  const total = result?.totalScore ?? 0
  const pct = maxTotal > 0 && total > 0 ? Math.round((total / maxTotal) * 100) : 0
  const scores = result?.scores ?? {}

  const PAD = 14
  const sectionLines = sections.map(s => {
    const label = s.name.padEnd(PAD)
    const score = scores[s.id] !== undefined && scores[s.id] !== '' ? scores[s.id] : '—'
    return `${label} : ${score} / ${s.maxScore}`
  })

  const content = [
    centerName || 'Trung Tâm Anh Ngữ',
    `Kết quả Mock Test: ${mockTest.title}`,
    `Học viên: ${student.name}    Ngày thi: ${fmtDate(mockTest.date)}`,
    '',
    ...sectionLines,
    '──────────────────────',
    `${'Tổng'.padEnd(PAD)} : ${total} / ${maxTotal} (${pct}%)`,
    '',
    'Nhận xét của giáo viên:',
    result?.teacherNote || '(Chưa có nhận xét)',
  ].join('\n')

  const fileName = `ketqua_${slugify(student.name)}_${slugify(mockTest.title)}.txt`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
