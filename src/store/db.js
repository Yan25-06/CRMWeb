// ─── Keys ───────────────────────────────────────────────
const KEYS = {
  STUDENTS: 'phf_students',
  CLASSES: 'phf_classes',
  ATTENDANCE: 'phf_attendance',
  FEES: 'phf_fees',
  SCHEDULE: 'phf_schedule',
  REVIEWS: 'phf_reviews',
  SETTINGS: 'phf_settings',
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
// Record shape: { id, studentId, classId, date: 'YYYY-MM-DD', present: bool, note? }
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

export const upsertAttendance = (records) => {
  // records: array of { studentId, classId, date, present, note? }
  const all = getAttendance()
  const updated = [...all]
  for (const rec of records) {
    const idx = updated.findIndex(
      a => a.studentId === rec.studentId && a.date === rec.date
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

// ─── Settings ────────────────────────────────────────────
export const getSettings = () => get(KEYS.SETTINGS, {
  teacherName: '',
  centerName: 'Trung Tâm',
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

  // Seed attendance for current month
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const days = [1, 3, 5, 8, 10, 12, 15, 17, 19, 22]
  const recs = []
  for (const d of days) {
    for (let i = 0; i < studentIds.length; i++) {
      recs.push({
        studentId: studentIds[i],
        classId: i < 3 ? cls1.id : cls2.id,
        date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        present: Math.random() > 0.15,
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
