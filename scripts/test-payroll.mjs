import assert from 'node:assert/strict'
import { buildPayrollRows, countWeekdayOccurrences } from '../src/utils/payroll.js'

let passed = 0
const test = (name, fn) => { fn(); passed++; console.log('  ✓', name) }

const teachers = [
  { id: 'tA', name: 'Cô A', email: 'a@x.vn', sessionRate: 100 },
  { id: 'tB', name: 'Cô B', email: 'b@x.vn', sessionRate: 200 },
]
const classes = [{ id: 'c1', teacherId: 'tA' }]

// Tháng 6/2026: T2 (dayOfWeek 1) và T4 (dayOfWeek 3).
const mondays   = countWeekdayOccurrences(2026, 6, 1)
const wednesdays = countWeekdayOccurrences(2026, 6, 3)

test('ca không gán GV thì quy về GV phụ trách lớp', () => {
  const schedule = [{ id: 's1', classId: 'c1', dayOfWeek: 1 }]
  const rows = buildPayrollRows({ year: 2026, month: 6, teachers, classes, schedule, attendance: [] })
  const a = rows.find(r => r.teacherId === 'tA')
  const b = rows.find(r => r.teacherId === 'tB')
  assert.equal(a.scheduled, mondays)
  assert.equal(b.scheduled, 0)
})

test('ca gán GV khác thì scheduled chuyển sang GV đó', () => {
  const schedule = [
    { id: 's1', classId: 'c1', dayOfWeek: 1, teacherId: null },
    { id: 's2', classId: 'c1', dayOfWeek: 3, teacherId: 'tB' },
  ]
  const rows = buildPayrollRows({ year: 2026, month: 6, teachers, classes, schedule, attendance: [] })
  assert.equal(rows.find(r => r.teacherId === 'tA').scheduled, mondays)
  assert.equal(rows.find(r => r.teacherId === 'tB').scheduled, wednesdays)
})

test('lương vẫn tính theo số buổi đã xác nhận dạy, không theo scheduled', () => {
  const schedule = [{ id: 's2', classId: 'c1', dayOfWeek: 3, teacherId: 'tB' }]
  const attendance = [
    { scheduleId: 's2', teacherId: 'tB', status: 'present' },
    { scheduleId: 's2', teacherId: 'tB', status: 'present' },
  ]
  const rows = buildPayrollRows({ year: 2026, month: 6, teachers, classes, schedule, attendance })
  const b = rows.find(r => r.teacherId === 'tB')
  assert.equal(b.taught, 2)
  assert.equal(b.actualPay, 400)
})

test('buổi dạy thay đã xác nhận tính cho người dạy thay', () => {
  const schedule = [{ id: 's1', classId: 'c1', dayOfWeek: 1 }]
  const attendance = [
    { scheduleId: 's1', teacherId: 'tA', status: 'absent', substituteTeacherId: 'tB', substituteConfirmed: true },
  ]
  const rows = buildPayrollRows({ year: 2026, month: 6, teachers, classes, schedule, attendance })
  assert.equal(rows.find(r => r.teacherId === 'tA').actualPay, 0)
  assert.equal(rows.find(r => r.teacherId === 'tB').actualPay, 200)
})

console.log(`\n${passed} test đã pass.`)
