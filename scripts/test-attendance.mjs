import assert from 'node:assert/strict'
import {
  toDateKey, dateKeyToISO, isSessionApplicable, summarizeAttendance,
} from '../src/utils/attendance.js'

let passed = 0
const test = (name, fn) => { fn(); passed++; console.log('  ✓', name) }

// 8 buổi cũ (tháng 10) + 2 buổi sau khi học sinh vào lớp (tháng 11)
const sessions = [
  ...Array.from({ length: 8 }, (_, i) => ({ id: `old${i + 1}`, date: `2026-10-${String(i * 3 + 1).padStart(2, '0')}` })),
  { id: 'new1', date: '2026-11-05' },
  { id: 'new2', date: '2026-11-08' },
]
const lateEnroll = { enrolledAt: new Date(2026, 10, 3, 9, 30).toISOString(), droppedAt: null }

test('toDateKey: giữ nguyên chuỗi ngày', () => {
  assert.equal(toDateKey('2026-11-03'), '2026-11-03')
})

test('toDateKey: ISO → ngày theo giờ địa phương', () => {
  assert.equal(toDateKey(new Date(2026, 10, 3, 0, 15).toISOString()), '2026-11-03')
  assert.equal(toDateKey(new Date(2026, 10, 3, 23, 50).toISOString()), '2026-11-03')
})

test('toDateKey: giá trị rỗng/hỏng → null', () => {
  assert.equal(toDateKey(null), null)
  assert.equal(toDateKey('abc'), null)
})

test('dateKeyToISO: ngày khác hôm nay → 00:00 địa phương, đọc lại đúng ngày', () => {
  assert.equal(toDateKey(dateKeyToISO('2026-10-01')), '2026-10-01')
})

test('isSessionApplicable: buổi trước ngày vào lớp → không áp dụng', () => {
  assert.equal(isSessionApplicable('2026-11-02', lateEnroll), false)
})

test('isSessionApplicable: buổi đúng ngày vào lớp → áp dụng', () => {
  assert.equal(isSessionApplicable('2026-11-03', lateEnroll), true)
})

test('isSessionApplicable: có bản ghi tường minh → luôn áp dụng', () => {
  assert.equal(isSessionApplicable('2026-10-01', lateEnroll, true), true)
})

test('isSessionApplicable: sau ngày nghỉ → không áp dụng; đúng ngày nghỉ vẫn áp dụng', () => {
  const dropped = { enrolledAt: '2026-10-01', droppedAt: new Date(2026, 9, 10, 15).toISOString() }
  assert.equal(isSessionApplicable('2026-10-10', dropped), true)
  assert.equal(isSessionApplicable('2026-10-11', dropped), false)
})

test('isSessionApplicable: không có enrollment → áp dụng', () => {
  assert.equal(isSessionApplicable('2026-10-01', null), true)
})

test('summarizeAttendance: vào lớp sau 8 buổi, vắng cả 2 buổi sau → 0/2, không phải 8/10', () => {
  const recs = new Map([['new1', { present: false }], ['new2', { present: false }]])
  const r = summarizeAttendance(sessions, lateEnroll, id => recs.get(id))
  assert.equal(r.total, 2)
  assert.equal(r.present, 0)
  assert.equal(r.rate, 0)
  assert.deepEqual(r.absentDates, ['2026-11-05', '2026-11-08'])
})

test('summarizeAttendance: thiếu bản ghi = có mặt (chỉ trong các buổi áp dụng)', () => {
  const r = summarizeAttendance(sessions, lateEnroll, () => undefined)
  assert.equal(r.total, 2)
  assert.equal(r.rate, 1)
})

test('summarizeAttendance: bản ghi cũ trước ngày vào lớp vẫn được tính', () => {
  const recs = new Map([['old8', { present: true }]])
  const r = summarizeAttendance(sessions, lateEnroll, id => recs.get(id))
  assert.equal(r.total, 3)
})

test('summarizeAttendance: không có buổi áp dụng → rate null', () => {
  const r = summarizeAttendance(sessions.slice(0, 8), lateEnroll, () => undefined)
  assert.equal(r.total, 0)
  assert.equal(r.rate, null)
})

test('summarizeAttendance: học sinh từ đầu khóa → tính mọi buổi', () => {
  const r = summarizeAttendance(sessions, { enrolledAt: '2026-09-01' }, () => undefined)
  assert.equal(r.total, 10)
})

console.log(`\n${passed} test passed`)
