/*
 * Sinh file SQL migrate dữ liệu từ web cũ (Firestore backup JSON) sang Supabase.
 * Chạy: node scripts/generate_migration_sql.cjs
 * Output: migration_from_old_web.sql (paste vào Supabase SQL Editor để chạy)
 *
 * Quyết định đã chốt với người dùng:
 * - teacher_id mới = a3e9bc5d-91cb-4923-bd10-89f21096e7b0
 * - BỎ QUA hoàn toàn nhóm dữ liệu cũ mồ côi (2 lớp đã xóa + ~24 HS đã xóa +
 *   toàn bộ 38 payment + session/attendance/homework tham chiếu chúng).
 * - payment default method = 'transfer' (nhưng thực tế KHÔNG migrate payment nào
 *   vì tất cả đều mồ côi — giữ ghi chú này phòng khi đổi quyết định).
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const TEACHER_ID = 'a3e9bc5d-91cb-4923-bd10-89f21096e7b0'
const BACKUP = path.join(__dirname, '..', 'backup_ms_phuong_2026-06-06.json')
const OUT = path.join(__dirname, '..', 'migration_from_old_web.sql')

const d = JSON.parse(fs.readFileSync(BACKUP, 'utf8'))

const classIds = new Set(d.classes.map(c => c.id))
const studentIds = new Set(d.students.map(s => s.id))

// --- ID remap: Firestore ID (không phải UUID) -> UUID mới, ổn định trong 1 lần sinh
const idMap = new Map()
const uuidFor = (oldId) => {
  if (!idMap.has(oldId)) idMap.set(oldId, crypto.randomUUID())
  return idMap.get(oldId)
}

// --- helpers SQL ---
const q = (v) => {
  if (v === null || v === undefined || v === '') return 'null'
  return `'${String(v).replace(/'/g, "''")}'`
}
// Luôn trả về chuỗi SQL (rỗng -> ''), dùng cho cột NOT NULL DEFAULT ''
const qStr = (v) => `'${String(v ?? '').replace(/'/g, "''")}'`
const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) ? 'null' : Number(v)
const bool = (v) => v ? 'true' : 'false'
const uuid = (v) => `'${v}'`

const lines = []
const stats = {}

lines.push('-- ============================================================')
lines.push('-- Migration: web cũ (Firestore) -> Supabase (Anh Ngữ Ms.Phương)')
lines.push(`-- Sinh tự động ${new Date().toISOString()}`)
lines.push(`-- teacher_id = ${TEACHER_ID}`)
lines.push('-- CHẠY TRONG SUPABASE SQL EDITOR (bypass RLS). Chỉ chạy MỘT lần.')
lines.push('-- ============================================================')
lines.push('')
lines.push('-- Tiền điều kiện: hồ sơ teacher phải tồn tại (đăng nhập web mới ít nhất 1 lần).')
lines.push('do $$')
lines.push('begin')
lines.push(`  if not exists (select 1 from public.teachers where id = '${TEACHER_ID}') then`)
lines.push(`    raise exception 'Khong tim thay teacher %. Hay dang nhap web moi it nhat 1 lan de tao ho so teacher roi chay lai.', '${TEACHER_ID}';`)
lines.push('  end if;')
lines.push('end $$;')
lines.push('')
lines.push('begin;')
lines.push('')

// --- 1. CLASSES ---
lines.push('-- 1. CLASSES (2 lớp hiện hành)')
stats.classes = 0
for (const c of d.classes) {
  const id = uuidFor(c.id)
  lines.push(
    `insert into public.classes (id, teacher_id, name, course_type, schedule_days, schedule_time, start_date, created_at) ` +
    `values (${uuid(id)}, ${uuid(TEACHER_ID)}, ${q(c.name)}, ${q(c.courseType)}, ${q(c.schedule)}, ${q(c.studyTime)}, ${q(c.startDate)}, ${q(c.createdAt)}) ` +
    `on conflict (id) do nothing;`
  )
  stats.classes++
}
lines.push('')

// --- 2. STUDENTS ---
lines.push('-- 2. STUDENTS (18 HS hiện hành)')
stats.students = 0
for (const s of d.students) {
  if (!classIds.has(s.classId)) continue // an toàn, không có case này
  const id = uuidFor(s.id)
  const email = (s.email && s.email.trim()) ? s.email.trim() : null
  const phone = (s.phone && String(s.phone).trim()) ? String(s.phone).trim() : null
  lines.push(
    `insert into public.students (id, teacher_id, name, phone, email, created_at) ` +
    `values (${uuid(id)}, ${uuid(TEACHER_ID)}, ${q(s.name.trim())}, ${q(phone)}, ${q(email)}, ${q(s.createdAt)}) ` +
    `on conflict (id) do nothing;`
  )
  stats.students++
}
lines.push('')

// --- 3. ENROLLMENTS (từ students.classId) ---
lines.push('-- 3. ENROLLMENTS (gắn HS vào lớp + học phí tháng)')
stats.enrollments = 0
for (const s of d.students) {
  if (!classIds.has(s.classId)) continue
  const sid = uuidFor(s.id)
  const cid = uuidFor(s.classId)
  const monthlyFee = (s.tuitionFee && Number(s.tuitionFee) > 0) ? Number(s.tuitionFee) : null
  const goalRaw = s.targetScore
  const goal = (typeof goalRaw === 'string' && goalRaw.trim() && goalRaw.trim() !== '0') ? goalRaw.trim() : null
  const note = (s.notes && s.notes.trim()) ? s.notes.trim() : null
  const status = (s.status === 'paused' || s.status === 'dropped') ? s.status : 'active'
  lines.push(
    `insert into public.enrollments (id, student_id, class_id, status, fee_type, monthly_fee, course_fee, goal, note, enrolled_at) ` +
    `values (gen_random_uuid(), ${uuid(sid)}, ${uuid(cid)}, ${q(status)}, 'monthly', ${num(monthlyFee)}, null, ${q(goal)}, ${q(note)}, ${q(s.createdAt)}) ` +
    `on conflict (student_id, class_id) do nothing;`
  )
  stats.enrollments++
}
lines.push('')

// --- 4. SESSIONS (bỏ session của lớp đã xóa) ---
lines.push('-- 4. SESSIONS (bỏ qua session của 2 lớp đã xóa)')
stats.sessions = 0
const sessByKey = {} // classId|date -> new session uuid (để match homework)
for (const sess of d.sessions) {
  if (!classIds.has(sess.classId)) continue
  const id = uuidFor(sess.id)
  const cid = uuidFor(sess.classId)
  sessByKey[sess.classId + '|' + sess.date] = id
  lines.push(
    `insert into public.sessions (id, class_id, date, created_manually, created_at) ` +
    `values (${uuid(id)}, ${uuid(cid)}, ${q(sess.date)}, true, ${q(sess.createdAt)}) ` +
    `on conflict (id) do nothing;`
  )
  stats.sessions++
}
lines.push('')

// --- 5. ATTENDANCE (bỏ session/HS mồ côi; late -> present=true) ---
lines.push('-- 5. ATTENDANCE (present/late -> có mặt; absent -> vắng)')
stats.attendance = 0
stats.attendanceSkipped = 0
for (const a of d.attendance) {
  const sessNew = idMap.get(a.sessionId)
  const studNew = idMap.get(a.studentId)
  // chỉ nhận khi cả session và student đều thuộc nhóm hiện hành
  if (!sessNew || !studentIds.has(a.studentId) || !classIds.has(a.classId)) { stats.attendanceSkipped++; continue }
  const present = a.status === 'absent' ? false : true // present hoặc late -> true
  lines.push(
    `insert into public.attendance (id, session_id, student_id, date, present) ` +
    `values (gen_random_uuid(), ${uuid(sessNew)}, ${uuid(studNew)}, ${q(a.date)}, ${bool(present)}) ` +
    `on conflict (session_id, student_id) do nothing;`
  )
  stats.attendance++
}
lines.push('')

// --- 6. HOMEWORKS (map vào bảng homeworks theo buổi) ---
lines.push('-- 6. HOMEWORKS (theo buổi: done/in_progress/not_done + ghi chú)')
stats.homeworks = 0
stats.homeworksSkipped = 0
const progressMap = { done: 'done', incomplete: 'in_progress', not_submitted: 'not_done' }
for (const h of d.homework) {
  if (!classIds.has(h.classId)) continue
  const sessId = sessByKey[h.classId + '|' + h.date]
  if (!sessId) continue // đã verify 25/25 khớp, nhưng phòng hờ
  for (const [oldStudId, sub] of Object.entries(h.submissions || {})) {
    if (!studentIds.has(oldStudId)) { stats.homeworksSkipped++; continue }
    const studNew = uuidFor(oldStudId)
    const progress = progressMap[sub.status] || 'not_done'
    const note = (sub.comment && sub.comment.trim()) ? sub.comment.trim() : ''
    lines.push(
      `insert into public.homeworks (id, session_id, student_id, progress, title, note, created_at) ` +
      `values (gen_random_uuid(), ${uuid(sessId)}, ${uuid(studNew)}, ${q(progress)}, ${qStr(h.title)}, ${qStr(note)}, ${q(h.createdAt)}) ` +
      `on conflict (session_id, student_id) do nothing;`
    )
    stats.homeworks++
  }
}
lines.push('')

// --- 7. MOCK TEST (1 đề TOEIC 28/05 + kết quả) ---
lines.push('-- 7. MOCK TEST (1 đề + kết quả; Listening+Reading, maxScore=25 — chỉnh lại trong UI nếu cần)')
const validScores = d.scores.filter(s => studentIds.has(s.studentId))
stats.mockResults = 0
if (validScores.length > 0) {
  // tất cả scores cùng lớp TOEIC, cùng ngày -> gom 1 mock_test
  const studClass = {}; d.students.forEach(s => studClass[s.id] = s.classId)
  const mtClassOld = studClass[validScores[0].studentId]
  const mtDate = validScores[0].date
  const mtId = crypto.randomUUID()
  const sections = [
    { name: 'Listening', maxScore: 25, order: 0 },
    { name: 'Reading', maxScore: 25, order: 1 },
  ]
  lines.push(
    `insert into public.mock_tests (id, class_id, title, date, sections, created_at) ` +
    `values (${uuid(mtId)}, ${uuid(uuidFor(mtClassOld))}, ${q('Mock Test ' + mtDate)}, ${q(mtDate)}, ` +
    `'${JSON.stringify(sections)}'::jsonb, now()) on conflict (id) do nothing;`
  )
  for (const sc of validScores) {
    const L = Number(sc.scores.listening) || 0
    const R = Number(sc.scores.reading) || 0
    const scoresJson = JSON.stringify({ Listening: L, Reading: R })
    const total = L + R
    const tn = (sc.notes && sc.notes.trim()) ? sc.notes.trim() : null
    lines.push(
      `insert into public.mock_test_results (id, mock_test_id, student_id, scores, total_score, teacher_note, created_at) ` +
      `values (gen_random_uuid(), ${uuid(mtId)}, ${uuid(uuidFor(sc.studentId))}, '${scoresJson}'::jsonb, ${total}, ${q(tn)}, ${q(sc.createdAt)}) ` +
      `on conflict (mock_test_id, student_id) do nothing;`
    )
    stats.mockResults++
  }
}
lines.push('')

lines.push('commit;')
lines.push('')
lines.push('-- ===== TÓM TẮT =====')
lines.push(`-- classes:      ${stats.classes}`)
lines.push(`-- students:     ${stats.students}`)
lines.push(`-- enrollments:  ${stats.enrollments}`)
lines.push(`-- sessions:     ${stats.sessions}`)
lines.push(`-- attendance:   ${stats.attendance} (bỏ ${stats.attendanceSkipped} mồ côi)`)
lines.push(`-- homeworks:    ${stats.homeworks} (bỏ ${stats.homeworksSkipped} submission của HS đã xóa)`)
lines.push(`-- mock results: ${stats.mockResults}`)
lines.push('-- payments:     0 (toàn bộ mồ côi — đã bỏ theo quyết định)')

fs.writeFileSync(OUT, lines.join('\n'), 'utf8')

console.log('Đã ghi:', OUT)
console.log(JSON.stringify(stats, null, 2))
