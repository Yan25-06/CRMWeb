// ─── Keys ───────────────────────────────────────────────
const KEYS = {
  STUDENTS: 'phf_students',
  CLASSES: 'phf_classes',
  ATTENDANCE: 'phf_attendance',
  FEES: 'phf_fees',
  SCHEDULE: 'phf_schedule',
  REVIEWS: 'phf_reviews',
  SETTINGS: 'phf_settings',
  ENROLLMENTS: 'phf_enrollments',
  SESSION_REVIEWS: 'phf_session_reviews',
  SESSIONS: 'phf_sessions',
  HOMEWORKS: 'phf_homeworks',
  MOCK_TESTS: 'phf_mock_tests',
  MOCK_TEST_RESULTS: 'phf_mock_test_results',
  PAYMENTS: 'phf_payments',
  HW_ASSIGNMENTS: 'phf_hw_assignments',
  SUBMISSIONS: 'phf_submissions',
}

// ─── Homework progress constants ────────────────────────
export const PROGRESS = { NOT_DONE: 'not_done', IN_PROGRESS: 'in_progress', DONE: 'done' }

// ─── Generic helpers ────────────────────────────────────
const get = (key, fallback = []) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}
const set = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('⚠️ Bộ nhớ trình duyệt đã đầy! Hãy xuất backup và xóa dữ liệu cũ để tiếp tục.')
    }
    throw e
  }
}

// Kiểm tra dung lượng localStorage đang dùng (bytes & %)
export const getStorageUsage = () => {
  let total = 0
  for (const key of Object.values(KEYS)) {
    total += (localStorage.getItem(key) || '').length * 2 // UTF-16: 2 bytes/char
  }
  const limit = 5 * 1024 * 1024 // ~5MB
  return { usedBytes: total, limitBytes: limit, percent: Math.round(total / limit * 100) }
}
export const uid = () => crypto.randomUUID()

// ─── Students ───────────────────────────────────────────
export const getStudents = () => get(KEYS.STUDENTS)
export const saveStudents = (s) => set(KEYS.STUDENTS, s)
export const addStudent = (data) => {
  const students = getStudents()
  const student = { id: uid(), createdAt: new Date().toISOString(), ...data }
  saveStudents([...students, student])
  return student
}
export const updateStudent = (id, data) => {
  saveStudents(getStudents().map(s => s.id === id ? { ...s, ...data } : s))
}
export const deleteStudent = (id) => {
  // Compute all filtered arrays first, then write in one batch
  const updates = [
    [KEYS.STUDENTS, getStudents().filter(s => s.id !== id)],
    [KEYS.ENROLLMENTS, getEnrollments().filter(e => e.studentId !== id)],
    [KEYS.ATTENDANCE, getAttendance().filter(a => a.studentId !== id)],
    [KEYS.HOMEWORKS, getHomeworks().filter(h => h.studentId !== id)],
    [KEYS.FEES, getFees().filter(f => f.studentId !== id)],
    [KEYS.REVIEWS, getReviews().filter(r => r.studentId !== id)],
    [KEYS.SESSION_REVIEWS, getSessionReviews().filter(r => r.studentId !== id)],
    [KEYS.PAYMENTS, getPayments().filter(p => p.studentId !== id)],
    [KEYS.SUBMISSIONS, getSubmissions().filter(s => s.studentId !== id)],
    [KEYS.MOCK_TEST_RESULTS, getMockTestResults().filter(r => r.studentId !== id)],
  ]
  updates.forEach(([key, value]) => set(key, value))
}

// ─── Classes ────────────────────────────────────────────
export const getClasses = () => get(KEYS.CLASSES)
export const saveClasses = (c) => set(KEYS.CLASSES, c)
export const addClass = (data) => {
  const classes = getClasses()
  const cls = { id: uid(), createdAt: new Date().toISOString(), ...data }
  saveClasses([...classes, cls])
  return cls
}
export const updateClass = (id, data) => {
  saveClasses(getClasses().map(c => c.id === id ? { ...c, ...data } : c))
}
export const deleteClass = (id) => {
  // Cache dependent data to avoid re-reading localStorage during filtering
  const allSessions = getSessions()
  const deletedSessionIds = new Set(allSessions.filter(s => s.classId === id).map(s => s.id))
  const allHwAssignments = getHwAssignments()
  const deletedAssignmentIds = new Set(allHwAssignments.filter(a => a.classId === id).map(a => a.id))
  const allMockTests = getMockTests()
  const deletedMockTestIds = new Set(allMockTests.filter(t => t.classId === id).map(t => t.id))

  // Compute all filtered arrays first, then write in one batch
  const updates = [
    [KEYS.CLASSES, getClasses().filter(c => c.id !== id)],
    [KEYS.ENROLLMENTS, getEnrollments().filter(e => e.classId !== id)],
    [KEYS.SESSIONS, allSessions.filter(s => s.classId !== id)],
    [KEYS.ATTENDANCE, getAttendance().filter(a => !deletedSessionIds.has(a.sessionId))],
    [KEYS.HOMEWORKS, getHomeworks().filter(h => !deletedSessionIds.has(h.sessionId))],
    [KEYS.SESSION_REVIEWS, getSessionReviews().filter(r => r.classId !== id)],
    [KEYS.HW_ASSIGNMENTS, allHwAssignments.filter(a => a.classId !== id)],
    [KEYS.SUBMISSIONS, getSubmissions().filter(s => !deletedAssignmentIds.has(s.hwAssignmentId))],
    [KEYS.PAYMENTS, getPayments().filter(p => p.classId !== id)],
    [KEYS.MOCK_TESTS, allMockTests.filter(t => t.classId !== id)],
    [KEYS.MOCK_TEST_RESULTS, getMockTestResults().filter(r => !deletedMockTestIds.has(r.mockTestId))],
  ]
  updates.forEach(([key, value]) => set(key, value))
}

// ─── Attendance ─────────────────────────────────────────
export const getAttendance = () => get(KEYS.ATTENDANCE)
export const saveAttendance = (a) => set(KEYS.ATTENDANCE, a)

export const getAttendanceByDate = (date) =>
  getAttendance().filter(a => a.date === date)

export const getAttendanceByStudent = (studentId) =>
  getAttendance().filter(a => a.studentId === studentId)

export const getAttendanceByMonth = (year, month) => {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return getAttendance().filter(a => a.date.startsWith(prefix))
}

export const getAttendanceBySession = (sessionId) =>
  getAttendance().filter(a => a.sessionId === sessionId)

export const upsertAttendanceBySession = (sessionId, studentId, present, note) => {
  const session = getSessionById(sessionId)
  if (!session) return null
  const all = getAttendance()
  const idx = all.findIndex(a => a.sessionId === sessionId && a.studentId === studentId)
  let rec = null
  if (idx >= 0) {
    rec = { ...all[idx], present }
    if (note !== undefined) rec.note = note
    all[idx] = rec
  } else {
    rec = { id: uid(), studentId, date: session.date, present, sessionId, note }
    all.push(rec)
  }
  saveAttendance(all)
  return rec
}

export const getAttendanceRate = (studentId, classId) => {
  const allSessions = getSessionsByClass(classId).filter(s => s.date <= new Date().toISOString().split('T')[0])
  if (allSessions.length === 0) return null

  const sessionIds = new Set(allSessions.map(s => s.id))
  const studentAtts = getAttendanceByStudent(studentId).filter(a => sessionIds.has(a.sessionId))
  let presentCount = 0
  for (const s of allSessions) {
    const att = studentAtts.find(a => a.sessionId === s.id)
    if (att && att.present) presentCount++
  }

  return Math.round((presentCount / allSessions.length) * 100)
}

export const upsertAttendance = (records) => {
  // records: array of { studentId, date, present, note?, sessionId? }
  const all = getAttendance()
  const updated = [...all]
  for (const rec of records) {
    const { classId: _, ...cleanRec } = rec
    const idx = updated.findIndex(
      a => a.studentId === cleanRec.studentId && (cleanRec.sessionId ? a.sessionId === cleanRec.sessionId : a.date === cleanRec.date)
    )
    if (idx >= 0) updated[idx] = { ...updated[idx], ...cleanRec }
    else updated.push({ id: uid(), ...cleanRec })
  }
  saveAttendance(updated)
}

// Count present sessions for a student in a month, optionally filtered by class
export const countSessions = (studentId, year, month, classId = null) => {
  if (classId) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    const sessionIds = new Set(
      getSessionsByClass(classId).filter(s => s.date.startsWith(prefix)).map(s => s.id)
    )
    return getAttendance().filter(
      a => a.studentId === studentId && a.present === true && sessionIds.has(a.sessionId)
    ).length
  }
  return getAttendanceByMonth(year, month).filter(
    a => a.studentId === studentId && a.present === true
  ).length
}

// ─── Fees ────────────────────────────────────────────────
// Shape: { id, studentId, year, month, feePerSession, surcharge, paid, note? }
export const getFees = () => get(KEYS.FEES)
export const saveFees = (f) => set(KEYS.FEES, f)

export const getFeeByStudentMonth = (studentId, year, month) =>
  getFees().find(f => f.studentId === studentId && f.year === year && f.month === month)

export const upsertFee = (data) => {
  const fees = getFees()
  const idx = fees.findIndex(
    f => f.studentId === data.studentId && f.year === data.year && f.month === data.month
  )
  if (idx >= 0) {
    fees[idx] = { ...fees[idx], ...data }
  } else {
    fees.push({ id: uid(), ...data })
  }
  saveFees(fees)
}

// Calculate total fee across all enrollments: Σ(sessions_per_class × feePerSession) + surcharge
export const calcFee = (studentId, year, month) => {
  const feeRec = getFeeByStudentMonth(studentId, year, month)
  const surcharge = feeRec?.surcharge ?? 0
  const activeEnrollments = getEnrollments().filter(
    e => e.studentId === studentId && e.status !== 'dropped'
  )
  const sessionFees = activeEnrollments.reduce((sum, e) => {
    const sessions = countSessions(studentId, year, month, e.classId)
    return sum + sessions * (e.feePerSession ?? 0)
  }, 0)
  return sessionFees + surcharge
}

// Tính trạng thái đã thanh toán động từ Payments thay vì dùng Fees.paid tĩnh
export const isFeePaid = (studentId, year, month) => {
  const period = `${year}-${String(month).padStart(2, '0')}`
  const totalPaid = getPaidAmountByStudentPeriod(studentId, period)
  const totalFee = calcFee(studentId, year, month)
  return totalFee > 0 && totalPaid >= totalFee
}

// ─── Schedule ────────────────────────────────────────────
// Shape: { id, classId, dayOfWeek (0-6), startTime, endTime, room?, note? }
export const getSchedule = () => get(KEYS.SCHEDULE)
export const saveSchedule = (s) => set(KEYS.SCHEDULE, s)
export const addScheduleItem = (data) => {
  const items = getSchedule()
  const item = { id: uid(), ...data }
  saveSchedule([...items, item])
  return item
}
export const deleteScheduleItem = (id) => {
  saveSchedule(getSchedule().filter(s => s.id !== id))
}
export const updateScheduleItem = (id, data) => {
  saveSchedule(getSchedule().map(s => s.id === id ? { ...s, ...data } : s))
}
export const getScheduleByDay = (dayOfWeek) =>
  getSchedule().filter(s => s.dayOfWeek === dayOfWeek).sort((a, b) => a.startTime.localeCompare(b.startTime))

// ─── Reviews ─────────────────────────────────────────────
// Shape: { id, studentId, classId, date, speakScore?, writeScore?, readScore?, listenScore?,
//          remark?, tags?: string[], advice?, teacherName?, absent?, absentReason? }
export const getReviews = () => get(KEYS.REVIEWS)
export const saveReviews = (r) => set(KEYS.REVIEWS, r)
export const upsertReview = (data) => {
  const reviews = getReviews()
  const idx = reviews.findIndex(
    r => r.studentId === data.studentId && r.classId === data.classId && r.date === data.date
  )
  // Spread merge handles new optional fields (readScore, listenScore, tags, advice, teacherName)
  // while preserving existing fields — backward compatible with old records
  if (idx >= 0) reviews[idx] = { ...reviews[idx], ...data }
  else reviews.push({ id: uid(), ...data })
  saveReviews(reviews)
}
export const getReviewsByStudent = (studentId, classId) =>
  getReviews()
    .filter(r => r.studentId === studentId && r.classId === classId)
    .sort((a, b) => b.date.localeCompare(a.date))

// ─── Homeworks (Phase C) ────────────────────────────
export const getHomeworks = () => get(KEYS.HOMEWORKS)
export const saveHomeworks = (h) => set(KEYS.HOMEWORKS, h)

export const getHomeworkBySession = (sessionId) =>
  getHomeworks().filter(h => h.sessionId === sessionId)

export const getHomeworkByStudent = (studentId, classId) => {
  const sessionIds = new Set(getSessionsByClass(classId).map(s => s.id))
  return getHomeworks().filter(h => h.studentId === studentId && sessionIds.has(h.sessionId))
}

export const updateHomework = (id, data) => {
  const all = getHomeworks()
  const idx = all.findIndex(h => h.id === id)
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() }
    saveHomeworks(all)
    return all[idx]
  }
  return null
}

export const updateSessionHomeworkTitle = (sessionId, title) => {
  const all = getHomeworks()
  let changed = false
  all.forEach(h => {
    if (h.sessionId === sessionId) {
      h.title = title
      h.updatedAt = new Date().toISOString()
      changed = true
    }
  })
  if (changed) saveHomeworks(all)
}

export const getHomeworkStats = (studentId, classId) => {
  const records = getHomeworkByStudent(studentId, classId)
  const stats = { done: 0, inProgress: 0, notDone: 0, total: records.length }
  records.forEach(r => {
    if (r.progress === 'done' || r.progress === 100) stats.done++
    else if (r.progress === 'in_progress' || r.progress === 50) stats.inProgress++
    else stats.notDone++
  })
  return stats
}

// ─── Sessions ────────────────────────────────────────────
// Shape: { id, classId, date, startTime, endTime, scheduleItemId?, createdManually, topic?, note?, createdAt }
export const getSessions = () => get(KEYS.SESSIONS)
export const saveSessions = (s) => set(KEYS.SESSIONS, s)

export const getSessionsByClass = (classId) =>
  getSessions().filter(s => s.classId === classId).sort((a, b) => new Date(b.date) - new Date(a.date))

export const getSessionById = (id) => getSessions().find(s => s.id === id)

export const createSession = (data) => {
  const sessions = getSessions()
  const session = { id: uid(), createdAt: new Date().toISOString(), createdManually: true, ...data }
  sessions.push(session)
  saveSessions(sessions)

  // Side-effect: create HomeworkRecord stub for each active student
  const activeStudents = getActiveStudents(data.classId)
  const homeworks = getHomeworks()
  const now = new Date().toISOString()
  activeStudents.forEach(s => {
    homeworks.push({
      id: uid(),
      sessionId: session.id,
      studentId: s.id,
      progress: 'not_done',
      title: '',
      note: '',
      createdAt: now,
      updatedAt: now
    })
  })
  saveHomeworks(homeworks)

  return session
}

// Update session metadata (date, time, topic, note) without touching attendance/homeworks
export const updateSession = (id, data) => {
  saveSessions(getSessions().map(s =>
    s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
  ))
}


export const deleteSession = (id) => {
  saveSessions(getSessions().filter(s => s.id !== id))
  // Cascade delete attendance and homeworks
  saveAttendance(getAttendance().filter(a => a.sessionId !== id))
  saveHomeworks(getHomeworks().filter(h => h.sessionId !== id))
}

// ─── StudentEnrollment ───────────────────────────────────
// Shape: { id, studentId, classId, status ('active'|'paused'|'dropped'), goal?, note?, enrolledAt, pausedAt?, droppedAt? }
export const getEnrollments = () => get(KEYS.ENROLLMENTS)
export const saveEnrollments = (e) => set(KEYS.ENROLLMENTS, e)

export const getEnrollmentsByClass = (classId) =>
  getEnrollments().filter(e => e.classId === classId)

export const getEnrollment = (studentId, classId) =>
  getEnrollments().find(e => e.studentId === studentId && e.classId === classId)

export const upsertEnrollment = (data) => {
  const enrollments = getEnrollments()
  const idx = enrollments.findIndex(
    e => e.studentId === data.studentId && e.classId === data.classId
  )
  const now = new Date().toISOString()
  let entry = idx >= 0 ? { ...enrollments[idx], ...data } : { id: uid(), enrolledAt: now, ...data }
  // Auto-write timestamps on status changes
  if (data.status === 'paused' && !entry.pausedAt) entry.pausedAt = now
  if (data.status === 'dropped' && !entry.droppedAt) entry.droppedAt = now
  if (data.status === 'active') { entry.pausedAt = null; entry.droppedAt = null }
  if (idx >= 0) enrollments[idx] = entry
  else enrollments.push(entry)
  saveEnrollments(enrollments)
  return entry
}

export const getActiveStudents = (classId) => {
  const activeEnrollments = getEnrollmentsByClass(classId).filter(e => e.status === 'active')
  const students = getStudents()
  return activeEnrollments.map(e => students.find(s => s.id === e.studentId)).filter(Boolean)
}

// ─── Session Reviews (Quick Remarks) ─────────────────────
// Shape: { id, studentId, classId, sessionId?, text, createdAt }
export const getSessionReviews = () => get(KEYS.SESSION_REVIEWS)
export const saveSessionReviews = (r) => set(KEYS.SESSION_REVIEWS, r)
export const addSessionReview = (data) => {
  const reviews = getSessionReviews()
  const entry = { id: uid(), createdAt: new Date().toISOString(), sessionId: null, ...data }
  saveSessionReviews([...reviews, entry])
  return entry
}
export const getSessionReviewsByStudent = (studentId, classId) =>
  getSessionReviews()
    .filter(r => r.studentId === studentId && r.classId === classId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

// ─── Settings ────────────────────────────────────────────
export const getSettings = () => get(KEYS.SETTINGS, {
  teacherName: '',
  centerName: 'Anh Ngữ Ms.Phương',
  defaultFeePerSession: 0,
  currency: 'đ',
})
export const saveSettings = (s) => set(KEYS.SETTINGS, { ...getSettings(), ...s })

// ─── Dashboard stats ─────────────────────────────────────

// Internal helper: same logic as calcFee but operates on pre-loaded in-memory
// arrays, avoiding repeated localStorage.getItem calls inside a reduce loop.
const calcFeeFromCache = (studentId, year, month, { fees, allEnrollments, allSessions, allAttendance }) => {
  const feeRec = fees.find(f => f.studentId === studentId && f.year === year && f.month === month)
  const surcharge = feeRec?.surcharge ?? 0
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  const activeEnrollments = allEnrollments.filter(
    e => e.studentId === studentId && e.status !== 'dropped'
  )
  const sessionFees = activeEnrollments.reduce((sum, e) => {
    const sessionIds = new Set(
      allSessions.filter(s => s.classId === e.classId && s.date.startsWith(prefix)).map(s => s.id)
    )
    const count = allAttendance.filter(
      a => a.studentId === studentId && a.present === true && sessionIds.has(a.sessionId)
    ).length
    return sum + count * (e.feePerSession ?? 0)
  }, 0)
  return sessionFees + surcharge
}

export const getDashboardStats = (year, month) => {
  // Pre-load all collections once — reduces localStorage parses from 80+ to 5
  const students = getStudents()
  const classes = getClasses()
  const fees = getFees()
  const allEnrollments = getEnrollments()
  const allSessions = getSessions()
  const allAttendance = getAttendance()
  const today = new Date().toISOString().split('T')[0]
  const presentToday = allAttendance.filter(a => a.date === today && a.present).length

  const cache = { fees, allEnrollments, allSessions, allAttendance }

  // Monthly revenue
  const monthlyRevenue = students.reduce((sum, s) => {
    return sum + calcFeeFromCache(s.id, year, month, cache)
  }, 0)

  // Yearly revenue: sum calcFee across all months that have a fee record
  const months = [...new Set(fees.filter(f => f.year === year).map(f => f.month))]
  const yearlyRevenue = students.reduce((sum, s) => {
    return sum + months.reduce((mSum, m) => mSum + calcFeeFromCache(s.id, year, m, cache), 0)
  }, 0)

  return {
    totalStudents: students.length,
    totalClasses: classes.length,
    presentToday,
    monthlyRevenue,
    yearlyRevenue,
  }
}

// ─── Export / Import ─────────────────────────────────────

// Internal helper: snapshot all collections as a plain JS object
const exportDataAsObject = () => ({
  version: 3,
  exportedAt: new Date().toISOString(),
  students: getStudents(),
  classes: getClasses(),
  enrollments: getEnrollments(),
  sessions: getSessions(),
  attendance: getAttendance(),
  homeworks: getHomeworks(),
  fees: getFees(),
  schedule: getSchedule(),
  reviews: getReviews(),
  sessionReviews: getSessionReviews(),
  settings: getSettings(),
  mockTests: getMockTests(),
  mockTestResults: getMockTestResults(),
  payments: getPayments(),
  hwAssignments: getHwAssignments(),
  submissions: getSubmissions(),
})

export const exportData = () => {
  const data = exportDataAsObject()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export const importData = (jsonString) => {
  const data = JSON.parse(jsonString)
  if (!data.version) throw new Error('File không hợp lệ')

  // Snapshot current data as backup before overwriting
  const backup = exportDataAsObject()

  const restoreBackup = () => {
    if (backup.students) saveStudents(backup.students)
    if (backup.classes) saveClasses(backup.classes)
    if (backup.enrollments) saveEnrollments(backup.enrollments)
    if (backup.sessions) saveSessions(backup.sessions)
    if (backup.attendance) saveAttendance(backup.attendance)
    if (backup.homeworks) saveHomeworks(backup.homeworks)
    if (backup.fees) saveFees(backup.fees)
    if (backup.schedule) saveSchedule(backup.schedule)
    if (backup.reviews) saveReviews(backup.reviews)
    if (backup.sessionReviews) saveSessionReviews(backup.sessionReviews)
    if (backup.settings) saveSettings(backup.settings)
    if (backup.mockTests) saveMockTests(backup.mockTests)
    if (backup.mockTestResults) saveMockTestResults(backup.mockTestResults)
    if (backup.payments) savePayments(backup.payments)
    if (backup.hwAssignments) saveHwAssignments(backup.hwAssignments)
    if (backup.submissions) saveSubmissions(backup.submissions)
  }

  try {
    if (data.students) saveStudents(data.students)
    if (data.classes) saveClasses(data.classes)
    if (data.enrollments) saveEnrollments(data.enrollments)
    if (data.sessions) saveSessions(data.sessions)
    if (data.attendance) saveAttendance(data.attendance)
    if (data.homeworks) saveHomeworks(data.homeworks)
    if (data.fees) saveFees(data.fees)
    if (data.schedule) saveSchedule(data.schedule)
    if (data.reviews) saveReviews(data.reviews)
    if (data.sessionReviews) saveSessionReviews(data.sessionReviews)
    if (data.settings) saveSettings(data.settings)
    if (data.mockTests) saveMockTests(data.mockTests)
    if (data.mockTestResults) saveMockTestResults(data.mockTestResults)
    if (data.payments) savePayments(data.payments)
    if (data.hwAssignments) saveHwAssignments(data.hwAssignments)
    if (data.submissions) saveSubmissions(data.submissions)
  } catch (err) {
    // Rollback to backup if any write fails mid-import
    restoreBackup()
    throw new Error('Import thất bại, dữ liệu đã được phục hồi.')
  }
}

// ─── Mock Tests ──────────────────────────────────────────
// MockTest shape: { id, classId, title, date, sections: [{id, name, maxScore, order}], teacherNote?, createdAt }
// MockTestResult shape: { id, mockTestId, studentId, scores: {[sectionId]: number}, totalScore, teacherNote?, createdAt, updatedAt }

export const getMockTests = () => get(KEYS.MOCK_TESTS)
export const saveMockTests = (v) => set(KEYS.MOCK_TESTS, v)

// 0.4
export const getMockTestsByClass = (classId) =>
  getMockTests()
    .filter(t => t.classId === classId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

// 0.5
export const createMockTest = (data) => {
  const tests = getMockTests()
  const test = { id: uid(), createdAt: new Date().toISOString(), ...data }
  saveMockTests([...tests, test])
  // Side-effect: create empty results for active students
  const activeStudents = getActiveStudents(data.classId)
  const results = getMockTestResults()
  const now = new Date().toISOString()
  activeStudents.forEach(s => {
    results.push({ id: uid(), mockTestId: test.id, studentId: s.id, scores: {}, totalScore: 0, teacherNote: '', createdAt: now, updatedAt: now })
  })
  saveMockTestResults(results)
  return test
}

// 0.6
export const updateMockTest = (id, data) => {
  const tests = getMockTests()
  const idx = tests.findIndex(t => t.id === id)
  if (idx < 0) return null
  tests[idx] = { ...tests[idx], ...data }
  saveMockTests(tests)
  return tests[idx]
}

// 0.7
export const deleteMockTest = (id) => {
  saveMockTests(getMockTests().filter(t => t.id !== id))
  saveMockTestResults(getMockTestResults().filter(r => r.mockTestId !== id))
}

export const getMockTestResults = () => get(KEYS.MOCK_TEST_RESULTS)
export const saveMockTestResults = (v) => set(KEYS.MOCK_TEST_RESULTS, v)

// 0.8
export const getMockTestResultsByTest = (mockTestId) =>
  getMockTestResults().filter(r => r.mockTestId === mockTestId)

// 0.9
export const getResultsByStudent = (studentId, classId) => {
  // Cache classTests once — eliminates ~46 localStorage parses inside sort comparator
  const classTests = getMockTestsByClass(classId)
  const testIds = new Set(classTests.map(t => t.id))
  const testMap = new Map(classTests.map(t => [t.id, t]))
  return getMockTestResults()
    .filter(r => r.studentId === studentId && testIds.has(r.mockTestId))
    .sort((a, b) => {
      const testA = testMap.get(a.mockTestId)
      const testB = testMap.get(b.mockTestId)
      return new Date(testA?.date) - new Date(testB?.date)
    })
}

// 0.10
export const upsertMockTestResult = (data) => {
  const results = getMockTestResults()
  const idx = results.findIndex(r => r.mockTestId === data.mockTestId && r.studentId === data.studentId)
  const now = new Date().toISOString()
  const scores = data.scores ?? (idx >= 0 ? results[idx].scores : {})
  const totalScore = Object.values(scores).reduce((s, v) => s + (Number(v) || 0), 0)
  const entry = idx >= 0
    ? { ...results[idx], ...data, scores, totalScore, updatedAt: now }
    : { id: uid(), createdAt: now, ...data, scores, totalScore, updatedAt: now }
  if (idx >= 0) results[idx] = entry
  else results.push(entry)
  saveMockTestResults(results)
  return entry
}

// ─── Payments ────────────────────────────────────────────
// Shape: { id, studentId, classId?, amount, paidAt: 'YYYY-MM-DD', method: 'cash'|'transfer', period: 'YYYY-MM', note?, createdAt }
export const getPayments = () => get(KEYS.PAYMENTS)
export const savePayments = (p) => set(KEYS.PAYMENTS, p)

export const getPaymentsByStudent = (studentId) =>
  getPayments()
    .filter(p => p.studentId === studentId)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))

export const getPaymentsByPeriod = (period) =>
  getPayments().filter(p => p.period === period)

export const getPaidAmountByStudentPeriod = (studentId, period) =>
  getPayments()
    .filter(p => p.studentId === studentId && p.period === period)
    .reduce((sum, p) => sum + (p.amount ?? 0), 0)

export const createPayment = (data) => {
  const payments = getPayments()
  const payment = { id: uid(), createdAt: new Date().toISOString(), ...data }
  savePayments([...payments, payment])
  return payment
}

export const deletePayment = (id) => {
  savePayments(getPayments().filter(p => p.id !== id))
}

// ─── Homework Assignments ─────────────────────────────────
// Shape: { id, classId, title, description?, assignedAt: 'YYYY-MM-DD', dueDate?: 'YYYY-MM-DD', createdAt }
export const getHwAssignments = () => get(KEYS.HW_ASSIGNMENTS)
export const saveHwAssignments = (a) => set(KEYS.HW_ASSIGNMENTS, a)

export const getHwAssignmentsByClass = (classId) =>
  getHwAssignments()
    .filter(a => a.classId === classId)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))

export const createHwAssignment = (data) => {
  const all = getHwAssignments()
  const entry = { id: uid(), createdAt: new Date().toISOString(), ...data }
  saveHwAssignments([...all, entry])
  return entry
}

export const updateHwAssignment = (id, data) => {
  saveHwAssignments(getHwAssignments().map(a => a.id === id ? { ...a, ...data } : a))
}

export const deleteHwAssignment = (id) => {
  saveHwAssignments(getHwAssignments().filter(a => a.id !== id))
  saveSubmissions(getSubmissions().filter(s => s.hwAssignmentId !== id))
}

// ─── Submissions ──────────────────────────────────────────
// Shape: { id, hwAssignmentId, studentId, submitted: bool, score?: number, comment?: string, gradedAt?: number }
export const getSubmissions = () => get(KEYS.SUBMISSIONS)
export const saveSubmissions = (s) => set(KEYS.SUBMISSIONS, s)

export const getSubmissionsByAssignment = (hwAssignmentId) =>
  getSubmissions().filter(s => s.hwAssignmentId === hwAssignmentId)

export const getSubmissionsByStudent = (studentId) =>
  getSubmissions().filter(s => s.studentId === studentId)

export const upsertSubmission = (data) => {
  const all = getSubmissions()
  const idx = all.findIndex(s => s.hwAssignmentId === data.hwAssignmentId && s.studentId === data.studentId)
  const now = new Date().toISOString()
  const entry = idx >= 0
    ? { ...all[idx], ...data, gradedAt: now }
    : { id: uid(), ...data, gradedAt: now }
  if (idx >= 0) all[idx] = entry
  else all.push(entry)
  saveSubmissions(all)
  return entry
}

export const deleteSubmissionsByAssignment = (hwAssignmentId) => {
  saveSubmissions(getSubmissions().filter(s => s.hwAssignmentId !== hwAssignmentId))
}

// ─── Seed demo data ──────────────────────────────────────
export const seedDemoData = () => {
  if (getStudents().length > 0) return // already seeded

  const y = new Date().getFullYear()
  const m = new Date().getMonth() + 1
  const pad = (n) => String(n).padStart(2, '0')
  const ym = `${y}-${pad(m)}`

  // ── Settings ──────────────────────────────────────────
  saveSettings({ teacherName: 'Ms.Phương', centerName: 'Anh Ngữ Ms.Phương' })

  // ── 3 Classes ─────────────────────────────────────────
  const cls1 = addClass({
    name: 'IELTS 02', level: '6.0+', maxStudents: 10,
    courseType: 'IELTS', scheduleDays: 'Thứ 2-4-6', scheduleTime: '19:00-20:30', startDate: '2026-03-01'
  })
  const cls2 = addClass({
    name: 'TOEIC 02', level: '500+', maxStudents: 8,
    courseType: 'TOEIC', scheduleDays: 'Thứ 3-5-7', scheduleTime: '19:00-20:30', startDate: '2026-03-15'
  })
  const cls3 = addClass({
    name: 'Giao Tiếp A1', level: 'Beginner', maxStudents: 12,
    courseType: 'Giao Tiếp', scheduleDays: 'Thứ 2-4', scheduleTime: '17:30-19:00', startDate: '2026-04-01'
  })

  // ── 10 Students ───────────────────────────────────────
  const studentData = [
    ['Nguyễn Minh Anh',   'Lớp 5',  '0901234001'],
    ['Trần Bảo Ngọc',     'Lớp 6',  '0901234002'],
    ['Lê Hoàng Nam',      'Lớp 7',  '0901234003'],
    ['Phạm Thu Hà',       'Lớp 5',  '0901234004'],
    ['Đặng Quốc Tuấn',   'Lớp 8',  '0901234005'],
    ['Vũ Ngọc Linh',     'Lớp 6',  '0901234006'],
    ['Hoàng Gia Bảo',    'Lớp 9',  '0901234007'],
    ['Ngô Thùy Trang',   'Lớp 7',  '0901234008'],
    ['Bùi Đức Minh',     'Lớp 10', '0901234009'],
    ['Mai Hương Giang',   'Lớp 8',  '0901234010'],
  ]
  const students = studentData.map(([name, grade, phone]) =>
    addStudent({ name, grade, phone })
  )
  const sIds = students.map(s => s.id)

  // ── Enrollments (spread across 3 classes) ─────────────
  const enrollCfg = [
    [0, cls1.id, 'active',  150000, 'Đạt 7.0 IELTS để du học Úc'],
    [1, cls1.id, 'active',  150000, 'Cải thiện nghe và đọc'],
    [2, cls1.id, 'active',  150000, 'Lấy chứng chỉ IELTS 6.5'],
    [3, cls1.id, 'paused',  150000, 'Chuẩn bị thi IELTS tháng 9'],
    [4, cls2.id, 'active',  120000, 'Đạt 650 TOEIC cho công việc'],
    [5, cls2.id, 'active',  120000, 'Nâng band TOEIC lên 700'],
    [6, cls2.id, 'active',  120000, 'Thi TOEIC tháng 8'],
    [7, cls3.id, 'active',  100000, 'Giao tiếp tiếng Anh cơ bản'],
    [8, cls3.id, 'active',  100000, 'Tự tin nói chuyện với người nước ngoài'],
    [9, cls3.id, 'active',  100000, 'Chuẩn bị phỏng vấn xin việc'],
    [0, cls3.id, 'active',  100000, 'Bổ sung kỹ năng giao tiếp'],
  ]
  enrollCfg.forEach(([si, classId, status, feePerSession, goal]) => {
    const entry = {
      studentId: sIds[si], classId, status, feePerSession, goal, note: '',
      enrolledAt: new Date(Date.now() - (60 - si * 5) * 86400000).toISOString(),
    }
    if (status === 'paused') entry.pausedAt = new Date(Date.now() - 5 * 86400000).toISOString()
    upsertEnrollment(entry)
  })

  // ── Sessions (5 sessions per class) ───────────────────
  const ieltsTopics = [
    'Unit 1: Introduction & Diagnostic Test', 'Unit 2: Listening Part 1 – Form Filling',
    'Unit 3: Reading – Skimming & Scanning', 'Unit 4: Writing Task 1 – Line Graph',
    'Unit 5: Speaking Part 1 – Familiar Topics',
  ]
  const toeicTopics = [
    'Part 1: Photographs', 'Part 2: Question-Response',
    'Part 3: Conversations', 'Part 4: Short Talks',
    'Part 5-6: Incomplete Sentences',
  ]
  const gtTopics = [
    'Lesson 1: Greetings & Self Introduction', 'Lesson 2: At the Restaurant',
    'Lesson 3: Asking for Directions', 'Lesson 4: Shopping & Bargaining',
    'Lesson 5: Talking About Family',
  ]
  const sessionDays = [1, 5, 8, 12, 15]
  const allSessions = { [cls1.id]: [], [cls2.id]: [], [cls3.id]: [] }
  for (const [clsId, topics] of [[cls1.id, ieltsTopics], [cls2.id, toeicTopics], [cls3.id, gtTopics]]) {
    topics.forEach((topic, i) => {
      const s = createSession({
        classId: clsId,
        date: `${ym}-${pad(sessionDays[i])}`,
        startTime: clsId === cls3.id ? '17:30' : '19:00',
        endTime:   clsId === cls3.id ? '19:00' : '20:30',
        topic,
      })
      allSessions[clsId].push(s)
    })
  }

  // ── Attendance ────────────────────────────────────────
  const attDays = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22]
  const attRecs = []
  const classStuMap = {
    [cls1.id]: [0, 1, 2, 3],
    [cls2.id]: [4, 5, 6],
    [cls3.id]: [0, 7, 8, 9],
  }
  for (const [classId, stuIdxs] of Object.entries(classStuMap)) {
    const sessions = allSessions[classId]
    for (let di = 0; di < attDays.length; di++) {
      for (const si of stuIdxs) {
        attRecs.push({
          studentId: sIds[si],
          date: `${ym}-${pad(attDays[di])}`,
          present: Math.random() > 0.12,
          sessionId: sessions[di] ? sessions[di].id : null,
        })
      }
    }
  }
  upsertAttendance(attRecs)

  // ── Fees + Payments ───────────────────────────────────
  const prevMonth = m === 1 ? 12 : m - 1
  const prevYear  = m === 1 ? y - 1 : y
  for (const id of sIds) {
    upsertFee({ studentId: id, year: y, month: m, surcharge: 0, paid: false })
    upsertFee({ studentId: id, year: prevYear, month: prevMonth, surcharge: 0, paid: true })
  }
  const paidStudents = [0, 1, 2, 4, 5, 7, 8]
  paidStudents.forEach(si => {
    createPayment({
      studentId: sIds[si],
      classId: si < 4 ? cls1.id : si < 7 ? cls2.id : cls3.id,
      amount: si < 4 ? 1800000 : si < 7 ? 1440000 : 1200000,
      paidAt: `${prevYear}-${pad(prevMonth)}-20`,
      method: si % 2 === 0 ? 'transfer' : 'cash',
      period: `${prevYear}-${pad(prevMonth)}`,
      note: '',
    })
  })
  createPayment({
    studentId: sIds[0], classId: cls1.id, amount: 1000000,
    paidAt: `${ym}-10`, method: 'transfer', period: ym, note: 'Đợt 1',
  })
  createPayment({
    studentId: sIds[4], classId: cls2.id, amount: 1440000,
    paidAt: `${ym}-12`, method: 'cash', period: ym, note: 'Thanh toán đủ',
  })

  // ── Schedule ──────────────────────────────────────────
  addScheduleItem({ classId: cls1.id, dayOfWeek: 1, startTime: '19:00', endTime: '20:30', room: 'Phòng 102', note: '' })
  addScheduleItem({ classId: cls1.id, dayOfWeek: 3, startTime: '19:00', endTime: '20:30', room: 'Phòng 102', note: '' })
  addScheduleItem({ classId: cls1.id, dayOfWeek: 5, startTime: '19:00', endTime: '20:30', room: 'Phòng 102', note: '' })
  addScheduleItem({ classId: cls2.id, dayOfWeek: 2, startTime: '19:00', endTime: '20:30', room: 'Phòng 105', note: '' })
  addScheduleItem({ classId: cls2.id, dayOfWeek: 4, startTime: '19:00', endTime: '20:30', room: 'Phòng 105', note: '' })
  addScheduleItem({ classId: cls2.id, dayOfWeek: 6, startTime: '19:00', endTime: '20:30', room: 'Phòng 105', note: '' })
  addScheduleItem({ classId: cls3.id, dayOfWeek: 1, startTime: '17:30', endTime: '19:00', room: 'Phòng 103', note: '' })
  addScheduleItem({ classId: cls3.id, dayOfWeek: 3, startTime: '17:30', endTime: '19:00', room: 'Phòng 103', note: '' })

  // ── Reviews (multi-period for multiple students) ──────
  const reviewSeed = [
    { si: 0, classId: cls1.id, date: `${prevYear}-${pad(prevMonth)}-15`,
      listen: 5.5, speak: 5, read: 5, write: 4.5,
      tags: ['Còn thụ động', 'Cần luyện viết thêm'],
      remark: 'Bắt đầu học, cần thêm thời gian làm quen',
      advice: 'Luyện nghe mỗi ngày 20 phút, làm bài tập về nhà đầy đủ.' },
    { si: 0, classId: cls1.id, date: `${ym}-01`,
      listen: 6.5, speak: 6, read: 6, write: 5.5,
      tags: ['Tiến bộ rõ rệt', 'Hăng hái'],
      remark: 'Tiến bộ rõ rệt sau 1 tháng',
      advice: 'Tiếp tục duy trì, tập trung vào kỹ năng viết essay.' },
    { si: 0, classId: cls1.id, date: `${ym}-15`,
      listen: 7, speak: 6.5, read: 6.5, write: 6,
      tags: ['Hăng hái', 'Phát âm chuẩn', 'Hiểu bài nhanh'],
      remark: 'Phát âm cải thiện rõ, tự tin hơn khi speaking',
      advice: 'Đang trên đà tốt! Thử luyện mock test IELTS tuần tới.' },
    { si: 1, classId: cls1.id, date: `${ym}-05`,
      listen: 6, speak: 5.5, read: 7, write: 5,
      tags: ['Làm tốt bài tập', 'Cần luyện viết thêm'],
      remark: 'Đọc rất tốt nhưng viết còn yếu',
      advice: 'Tập viết mỗi ngày 1 paragraph, chú ý grammar.' },
    { si: 1, classId: cls1.id, date: `${ym}-18`,
      listen: 6.5, speak: 6, read: 7.5, write: 5.5,
      tags: ['Tiến bộ rõ rệt', 'Làm tốt bài tập'],
      remark: 'Reading tăng rõ, writing cũng cải thiện',
      advice: 'Bắt đầu làm full test để quen format.' },
    { si: 4, classId: cls2.id, date: `${ym}-03`,
      listen: 5, speak: 4, read: 6, write: 5.5,
      tags: ['Quên bài tập', 'Chưa tập trung'],
      remark: 'Hay quên bài, cần nhắc nhở thường xuyên',
      advice: 'Lập kế hoạch học tập, dành 30 phút/ngày cho TOEIC.' },
    { si: 4, classId: cls2.id, date: `${ym}-17`,
      listen: 6, speak: 5, read: 6.5, write: 6,
      tags: ['Tiến bộ rõ rệt', 'Hăng hái'],
      remark: 'Đã chú ý hơn, điểm tăng đều',
      advice: 'Tiếp tục luyện part 3-4, đây là phần dễ lấy điểm nhất.' },
    { si: 7, classId: cls3.id, date: `${ym}-10`,
      listen: 4, speak: 3.5, read: 5, write: 4,
      tags: ['Đến muộn', 'Còn thụ động'],
      remark: 'Hay đến muộn 10-15 phút, cần cải thiện',
      advice: 'Cố gắng đi đúng giờ, tham gia phát biểu nhiều hơn.' },
  ]
  reviewSeed.forEach(r => {
    upsertReview({
      studentId: sIds[r.si], classId: r.classId, date: r.date,
      listenScore: r.listen, speakScore: r.speak, readScore: r.read, writeScore: r.write,
      tags: r.tags, remark: r.remark, advice: r.advice, teacherName: 'Ms.Phương',
    })
  })

  // ── Session Reviews ───────────────────────────────────
  const sessionRevs = [
    { si: 0, classId: cls1.id, sIdx: 0, text: 'Tập trung tốt, trả lời nhanh phần listening' },
    { si: 1, classId: cls1.id, sIdx: 0, text: 'Cần luyện thêm vocabulary' },
    { si: 2, classId: cls1.id, sIdx: 1, text: 'Hăng hái phát biểu, reading skills tốt' },
    { si: 4, classId: cls2.id, sIdx: 0, text: 'Chưa làm bài tập về nhà' },
    { si: 5, classId: cls2.id, sIdx: 1, text: 'Part 2 cải thiện rõ rệt' },
    { si: 7, classId: cls3.id, sIdx: 0, text: 'Nhút nhát, cần khuyến khích nói nhiều hơn' },
    { si: 8, classId: cls3.id, sIdx: 1, text: 'Tự tin giao tiếp, phản xạ nhanh' },
  ]
  sessionRevs.forEach(sr => {
    const session = allSessions[sr.classId]?.[sr.sIdx]
    if (session) {
      upsertSessionReview({
        studentId: sIds[sr.si], classId: sr.classId,
        sessionId: session.id, text: sr.text,
      })
    }
  })

  // ── Homework Assignments + Submissions ────────────────
  const hw1 = createHwAssignment({
    classId: cls1.id, title: 'IELTS Writing Task 1 – Bar Chart',
    description: 'Viết 150 từ mô tả biểu đồ cột về dân số.',
    assignedAt: `${ym}-05`, dueDate: `${ym}-10`,
  })
  const hw2 = createHwAssignment({
    classId: cls1.id, title: 'Listening Practice Test 1',
    description: 'Làm full test listening, ghi điểm.',
    assignedAt: `${ym}-10`, dueDate: `${ym}-15`,
  })
  const hw3 = createHwAssignment({
    classId: cls2.id, title: 'TOEIC Part 5 – Grammar Drill',
    description: '30 câu incomplete sentences.',
    assignedAt: `${ym}-08`, dueDate: `${ym}-12`,
  })
  const hw4 = createHwAssignment({
    classId: cls3.id, title: 'Record Self Introduction',
    description: 'Ghi âm bài tự giới thiệu bản thân 2 phút.',
    assignedAt: `${ym}-05`, dueDate: `${ym}-09`,
  })
  const hwSubs = [
    { hwId: hw1.id, si: 0, submitted: true, score: 7, comment: 'Bài viết tốt, cấu trúc rõ ràng' },
    { hwId: hw1.id, si: 1, submitted: true, score: 6, comment: 'Cần thêm chi tiết, thiếu overview' },
    { hwId: hw1.id, si: 2, submitted: true, score: 8, comment: 'Xuất sắc! Vocabulary phong phú' },
    { hwId: hw1.id, si: 3, submitted: false },
    { hwId: hw2.id, si: 0, submitted: true, score: 7.5, comment: 'Nghe tốt, sai 3 câu part 4' },
    { hwId: hw2.id, si: 1, submitted: true, score: 6.5, comment: 'Part 2 cần cải thiện' },
    { hwId: hw2.id, si: 2, submitted: false },
    { hwId: hw3.id, si: 4, submitted: true, score: 24, comment: '24/30, sai chủ yếu phần tense' },
    { hwId: hw3.id, si: 5, submitted: true, score: 27, comment: '27/30, rất tốt!' },
    { hwId: hw3.id, si: 6, submitted: true, score: 22, comment: '22/30, ôn thêm prepositions' },
    { hwId: hw4.id, si: 7, submitted: true, score: 6, comment: 'Nói chậm nhưng phát âm rõ' },
    { hwId: hw4.id, si: 8, submitted: true, score: 8, comment: 'Tự nhiên, lưu loát' },
    { hwId: hw4.id, si: 9, submitted: false },
  ]
  hwSubs.forEach(s => {
    upsertSubmission({
      hwAssignmentId: s.hwId, studentId: sIds[s.si],
      submitted: s.submitted, score: s.score ?? null, comment: s.comment ?? '',
    })
  })

  // ── Mock Tests + Results ──────────────────────────────
  const sec1 = uid(), sec2 = uid(), sec3 = uid(), sec4 = uid()
  const mt1 = createMockTest({
    classId: cls1.id, title: 'IELTS Mini Test 1', date: `${ym}-12`,
    sections: [
      { id: sec1, name: 'Listening', maxScore: 40, order: 1 },
      { id: sec2, name: 'Reading',   maxScore: 40, order: 2 },
      { id: sec3, name: 'Writing',   maxScore: 9,  order: 3 },
      { id: sec4, name: 'Speaking',  maxScore: 9,  order: 4 },
    ],
    teacherNote: 'Đề thi thử lần 1 – 120 phút',
  })
  const ieltsScores = [
    [0, { [sec1]: 30, [sec2]: 28, [sec3]: 6, [sec4]: 6.5 }, 'Listening tốt, cải thiện writing'],
    [1, { [sec1]: 25, [sec2]: 32, [sec3]: 5.5, [sec4]: 5 }, 'Reading rất tốt, speaking cần luyện'],
    [2, { [sec1]: 28, [sec2]: 30, [sec3]: 7, [sec4]: 7 }, 'Kết quả đồng đều, rất ấn tượng'],
  ]
  ieltsScores.forEach(([si, scores, note]) => {
    upsertMockTestResult({ mockTestId: mt1.id, studentId: sIds[si], scores, teacherNote: note })
  })

  const tsec1 = uid(), tsec2 = uid()
  const mt2 = createMockTest({
    classId: cls2.id, title: 'TOEIC Practice Test 1', date: `${ym}-14`,
    sections: [
      { id: tsec1, name: 'Listening (Part 1-4)', maxScore: 495, order: 1 },
      { id: tsec2, name: 'Reading (Part 5-7)',   maxScore: 495, order: 2 },
    ],
    teacherNote: 'Full test 120 phút',
  })
  const toeicScores = [
    [4, { [tsec1]: 310, [tsec2]: 280 }, 'Listening khá, reading cần cải thiện part 7'],
    [5, { [tsec1]: 350, [tsec2]: 320 }, 'Tốt! Cần tăng tốc part 7'],
    [6, { [tsec1]: 280, [tsec2]: 250 }, 'Cần luyện nhiều hơn, đặc biệt part 3-4'],
  ]
  toeicScores.forEach(([si, scores, note]) => {
    upsertMockTestResult({ mockTestId: mt2.id, studentId: sIds[si], scores, teacherNote: note })
  })
}

