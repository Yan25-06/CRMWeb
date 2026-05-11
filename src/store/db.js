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
}

// ─── Generic helpers ────────────────────────────────────
const get = (key, fallback = []) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}
const set = (key, value) => localStorage.setItem(key, JSON.stringify(value))
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

// ─── Students ───────────────────────────────────────────
export const getStudents = () => get(KEYS.STUDENTS)
export const saveStudents = (s) => set(KEYS.STUDENTS, s)
export const addStudent = (data) => {
  const students = getStudents()
  const student = { id: uid(), createdAt: Date.now(), ...data }
  saveStudents([...students, student])
  return student
}
export const updateStudent = (id, data) => {
  saveStudents(getStudents().map(s => s.id === id ? { ...s, ...data } : s))
}
export const deleteStudent = (id) => {
  saveStudents(getStudents().filter(s => s.id !== id))
}

// ─── Classes ────────────────────────────────────────────
export const getClasses = () => get(KEYS.CLASSES)
export const saveClasses = (c) => set(KEYS.CLASSES, c)
export const addClass = (data) => {
  const classes = getClasses()
  const cls = { id: uid(), createdAt: Date.now(), ...data }
  saveClasses([...classes, cls])
  return cls
}
export const updateClass = (id, data) => {
  saveClasses(getClasses().map(c => c.id === id ? { ...c, ...data } : c))
}
export const deleteClass = (id) => {
  saveClasses(getClasses().filter(c => c.id !== id))
}

// ─── Attendance ─────────────────────────────────────────
// Record shape: { id, studentId, classId, date: 'YYYY-MM-DD', present: bool, note?, sessionId?: string }
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
    rec = { id: uid(), studentId, classId: session.classId, date: session.date, present, sessionId, note }
    all.push(rec)
  }
  saveAttendance(all)
  return rec
}

export const getAttendanceRate = (studentId, classId) => {
  const allSessions = getSessionsByClass(classId).filter(s => s.date <= new Date().toISOString().split('T')[0])
  if (allSessions.length === 0) return 0
  const allAtt = getAttendanceByStudent(studentId).filter(a => a.classId === classId && a.present)
  return Math.round((allAtt.length / allSessions.length) * 100)
}

export const upsertAttendance = (records) => {
  // records: array of { studentId, classId, date, present, note?, sessionId? }
  const all = getAttendance()
  const updated = [...all]
  for (const rec of records) {
    const idx = updated.findIndex(
      a => a.studentId === rec.studentId && (rec.sessionId ? a.sessionId === rec.sessionId : a.date === rec.date)
    )
    if (idx >= 0) updated[idx] = { ...updated[idx], ...rec }
    else updated.push({ id: uid(), ...rec })
  }
  saveAttendance(updated)
}

// Count present sessions for a student in a month
export const countSessions = (studentId, year, month) => {
  const recs = getAttendanceByMonth(year, month)
  return recs.filter(a => a.studentId === studentId && a.present).length
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

// Calculate fee amount: sessions * feePerSession + surcharge
export const calcFee = (studentId, year, month) => {
  const sessions = countSessions(studentId, year, month)
  const feeRec = getFeeByStudentMonth(studentId, year, month)
  const rate = feeRec?.feePerSession ?? 0
  const surcharge = feeRec?.surcharge ?? 0
  return sessions * rate + surcharge
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

// ─── Reviews ─────────────────────────────────────────────
// Shape: { id, studentId, classId, date, speakScore, writeScore, remark, absent?, absentReason? }
export const getReviews = () => get(KEYS.REVIEWS)
export const saveReviews = (r) => set(KEYS.REVIEWS, r)
export const upsertReview = (data) => {
  const reviews = getReviews()
  const idx = reviews.findIndex(
    r => r.studentId === data.studentId && r.date === data.date
  )
  if (idx >= 0) reviews[idx] = { ...reviews[idx], ...data }
  else reviews.push({ id: uid(), ...data })
  saveReviews(reviews)
}

// ─── Homeworks (Phase C Stub) ────────────────────────────
export const getHomeworks = () => get(KEYS.HOMEWORKS)
export const saveHomeworks = (h) => set(KEYS.HOMEWORKS, h)

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
  activeStudents.forEach(s => {
    homeworks.push({ id: uid(), sessionId: session.id, studentId: s.id, classId: data.classId, progress: 50 })
  })
  saveHomeworks(homeworks)

  return session
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
export const getDashboardStats = (year, month) => {
  const students = getStudents()
  const classes = getClasses()
  const attMonth = getAttendanceByMonth(year, month)
  const fees = getFees()
  const today = new Date().toISOString().split('T')[0]
  const attToday = getAttendanceByDate(today)
  const presentToday = attToday.filter(a => a.present).length

  // Monthly revenue
  const monthlyRevenue = students.reduce((sum, s) => {
    return sum + calcFee(s.id, year, month)
  }, 0)

  // Yearly revenue
  const yearlyRevenue = fees
    .filter(f => f.year === year)
    .reduce((sum, f) => {
      const s = getStudents().find(st => st.id === f.studentId)
      if (!s) return sum
      const sessions = countSessions(f.studentId, year, f.month)
      return sum + sessions * (f.feePerSession ?? 0) + (f.surcharge ?? 0)
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
export const exportData = () => {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    students: getStudents(),
    classes: getClasses(),
    attendance: getAttendance(),
    fees: getFees(),
    schedule: getSchedule(),
    reviews: getReviews(),
    settings: getSettings(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `phieuhocphi_backup_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export const importData = (jsonString) => {
  const data = JSON.parse(jsonString)
  if (!data.version) throw new Error('File không hợp lệ')
  if (data.students) saveStudents(data.students)
  if (data.classes) saveClasses(data.classes)
  if (data.attendance) saveAttendance(data.attendance)
  if (data.fees) saveFees(data.fees)
  if (data.schedule) saveSchedule(data.schedule)
  if (data.reviews) saveReviews(data.reviews)
  if (data.settings) saveSettings(data.settings)
}

// ─── Seed demo data ──────────────────────────────────────
export const seedDemoData = () => {
  if (getStudents().length > 0) return // already seeded

  const cls1 = addClass({
    name: 'IELTS 02', level: '6.0+', maxStudents: 10,
    courseType: 'IELTS', scheduleDays: 'Thứ 2-4-6', scheduleTime: '19:00-20:30', startDate: '2026-05-11'
  })
  const cls2 = addClass({
    name: 'TOEIC 02', level: '500+', maxStudents: 8,
    courseType: 'TOEIC', scheduleDays: 'Thứ 3-5-7', scheduleTime: '19:00-20:30', startDate: '2026-05-05'
  })

  const names = [
    ['Nguyễn Minh Anh', 'Lớp 5'], ['Trần Bảo Ngọc', 'Lớp 6'],
    ['Lê Hoàng Nam', 'Lớp 7'], ['Phạm Thu Hà', 'Lớp 5'],
    ['Đặng Quốc Tuấn', 'Lớp 8'], ['Vũ Ngọc Linh', 'Lớp 6'],
  ]
  const studentIds = names.map(([name, grade], i) => {
    const s = addStudent({
      name,
      grade,
      classId: i < 3 ? cls1.id : cls2.id,
      feePerSession: 150000,
      phone: `090${String(i + 1).padStart(7, '0')}`,
    })
    return s.id
  })

  // Seed enrollments for demo students
  const goals = [
    'Đạt 7.0 IELTS để du học Úc', 'Cải thiện kỹ năng nghe và đọc',
    'Lấy chứng chỉ IELTS', 'Đạt 650 TOEIC cho công việc',
    'Nâng cao kỹ năng giao tiếp', 'Chuẩn bị cho kỳ thi TOEIC tháng 8',
  ]
  const statuses = ['active', 'active', 'active', 'active', 'paused', 'active']
  studentIds.forEach((studentId, i) => {
    const classId = i < 3 ? cls1.id : cls2.id
    const status = statuses[i]
    const entry = {
      studentId,
      classId,
      status,
      goal: goals[i],
      note: '',
      enrolledAt: new Date(Date.now() - (30 - i * 3) * 24 * 60 * 60 * 1000).toISOString(),
    }
    if (status === 'paused') entry.pausedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    upsertEnrollment(entry)
  })

  // Seed sessions
  const y = new Date().getFullYear()
  const m = new Date().getMonth() + 1
  const s1 = createSession({
    classId: cls1.id, date: `${y}-${String(m).padStart(2, '0')}-01`, startTime: '19:00', endTime: '20:30', topic: 'Unit 1: Introduction to IELTS'
  })
  const s2 = createSession({
    classId: cls1.id, date: `${y}-${String(m).padStart(2, '0')}-03`, startTime: '19:00', endTime: '20:30', topic: 'Unit 2: Listening Part 1'
  })
  const s3 = createSession({
    classId: cls1.id, date: `${y}-${String(m).padStart(2, '0')}-05`, startTime: '19:00', endTime: '20:30', topic: 'Unit 3: Reading Techniques'
  })

  // Seed attendance for current month
  const now = new Date()
  const days = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22]
  const recs = []
  const sessionIdsCls1 = [s1.id, s2.id, s3.id, null, null, null, null, null, null, null]
  for (let d_idx = 0; d_idx < days.length; d_idx++) {
    const d = days[d_idx]
    for (let i = 0; i < studentIds.length; i++) {
      const classId = i < 3 ? cls1.id : cls2.id
      let sessionId = null
      if (classId === cls1.id) sessionId = sessionIdsCls1[d_idx]

      recs.push({
        studentId: studentIds[i],
        classId: classId,
        date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        present: Math.random() > 0.15,
        sessionId
      })
    }
  }
  upsertAttendance(recs)

  // Seed fees
  for (const id of studentIds) {
    upsertFee({ studentId: id, year: y, month: m, feePerSession: 150000, surcharge: 0, paid: false })
  }

  saveSettings({ teacherName: 'Ms.Phương', centerName: 'Anh Ngữ Ms.Phương' })
}
