import assert from 'node:assert/strict'
import { filterFeeRows, countFeeStudents } from '../src/utils/fees.js'

let passed = 0
const test = (name, fn) => { fn(); passed++; console.log('  ✓', name) }

const rows = [
  { studentId: 's1', classId: 'c1', name: 'An',  className: 'IELTS 1', monthlyFee: 1000, paid: true },
  { studentId: 's1', classId: 'c2', name: 'An',  className: 'TOEIC 1', monthlyFee: 2000, paid: false },
  { studentId: 's2', classId: 'c1', name: 'Bình', className: 'IELTS 1', monthlyFee: 1000, paid: true },
  { studentId: 's3', classId: 'c2', name: 'Chi', className: 'TOEIC 1', monthlyFee: 2000, paid: false },
]

test('filterFeeRows: "all" giữ nguyên mọi dòng', () => {
  assert.equal(filterFeeRows(rows, { className: 'all', status: 'all' }).length, 4)
})

test('filterFeeRows: lọc theo tên lớp', () => {
  const out = filterFeeRows(rows, { className: 'IELTS 1', status: 'all' })
  assert.deepEqual(out.map(r => r.studentId), ['s1', 's2'])
})

test('filterFeeRows: lọc theo trạng thái', () => {
  assert.equal(filterFeeRows(rows, { className: 'all', status: 'paid' }).length, 2)
  assert.equal(filterFeeRows(rows, { className: 'all', status: 'debt' }).length, 2)
})

test('filterFeeRows: lọc lớp và trạng thái cùng lúc', () => {
  const out = filterFeeRows(rows, { className: 'TOEIC 1', status: 'debt' })
  assert.deepEqual(out.map(r => r.studentId), ['s1', 's3'])
})

test('countFeeStudents: học sinh đa lớp chỉ tính đủ khi MỌI lớp đã tick', () => {
  assert.deepEqual(countFeeStudents(rows), { total: 3, paid: 1, debt: 2 })
})

test('countFeeStudents: mọi lớp đã tick thì không còn nợ', () => {
  const allPaid = rows.map(r => ({ ...r, paid: true }))
  assert.deepEqual(countFeeStudents(allPaid), { total: 3, paid: 3, debt: 0 })
})

test('countFeeStudents: danh sách rỗng', () => {
  assert.deepEqual(countFeeStudents([]), { total: 0, paid: 0, debt: 0 })
})

// monthlyFee <= 0 ("free" — chưa có học phí cấu hình, ô hiển thị "—" ở FeesTable)
// không được tính là "chưa đóng": không thể "chưa đóng" một khoản phí không tồn tại.
const rowsWithFree = [
  ...rows,
  { studentId: 's4', classId: 'c3', name: 'Dũng', className: 'IELTS 1', monthlyFee: 0, paid: false },
]

test('countFeeStudents: lớp không có học phí (monthlyFee 0) không tính vào nợ', () => {
  assert.deepEqual(countFeeStudents(rowsWithFree), { total: 3, paid: 1, debt: 2 })
})

test('countFeeStudents: học sinh chỉ có lớp free không tính vào total', () => {
  const onlyFree = [{ studentId: 's5', classId: 'c4', name: 'Em', className: 'TOEIC 1', monthlyFee: 0, paid: false }]
  assert.deepEqual(countFeeStudents(onlyFree), { total: 0, paid: 0, debt: 0 })
})

test('filterFeeRows: dòng monthlyFee 0 không xuất hiện ở tab "Chưa đóng"', () => {
  const out = filterFeeRows(rowsWithFree, { className: 'all', status: 'debt' })
  assert.deepEqual(out.map(r => r.studentId), ['s1', 's3'])
})

test('filterFeeRows: dòng monthlyFee 0 không xuất hiện ở tab "Đã đóng"', () => {
  const freePaid = { studentId: 's6', classId: 'c5', name: 'Phong', className: 'TOEIC 1', monthlyFee: 0, paid: true }
  const out = filterFeeRows([...rowsWithFree, freePaid], { className: 'all', status: 'paid' })
  assert.equal(out.some(r => r.studentId === 's6'), false)
})

console.log(`\n${passed} test đã pass.`)
