const VERSION_KEY = 'phf_version'

const getVersion = () => parseInt(localStorage.getItem(VERSION_KEY) || '1')
const setVersion = (v) => localStorage.setItem(VERSION_KEY, String(v))

// ─── v1 → v2 ────────────────────────────────────────────
// Changes:
// 1. Move feePerSession from fees → enrollments
// 2. Add classId to fees records (for class-based queries)
// 3. Remove classId from attendance records (derivable via sessionId)
// 4. Remove classId from homeworks records (derivable via sessionId)
// 5. Convert homework progress 0/50/100 → 'not_done'/'in_progress'/'done'
const migrateV1toV2 = () => {
  // 1 & 2: fees ↔ enrollments
  try {
    const fees = JSON.parse(localStorage.getItem('phf_fees') || '[]')
    const enrollments = JSON.parse(localStorage.getItem('phf_enrollments') || '[]')

    const feeMap = {}
    fees.forEach(f => {
      if (!feeMap[f.studentId] || f.feePerSession) {
        feeMap[f.studentId] = f.feePerSession ?? 0
      }
    })

    const updatedEnrollments = enrollments.map(e => ({
      ...e,
      feePerSession: e.feePerSession ?? feeMap[e.studentId] ?? 0,
    }))

    const updatedFees = fees.map(({ feePerSession: _, ...rest }) => rest)

    localStorage.setItem('phf_enrollments', JSON.stringify(updatedEnrollments))
    localStorage.setItem('phf_fees', JSON.stringify(updatedFees))
  } catch (e) {
    console.error('Migration v1→v2 step 1/2 failed:', e)
  }

  // 3: remove classId from attendance
  try {
    const attendance = JSON.parse(localStorage.getItem('phf_attendance') || '[]')
    const updated = attendance.map(({ classId: _, ...rest }) => rest)
    localStorage.setItem('phf_attendance', JSON.stringify(updated))
  } catch (e) {
    console.error('Migration v1→v2 step 3 failed:', e)
  }

  // 4: remove classId from homeworks
  try {
    const homeworks = JSON.parse(localStorage.getItem('phf_homeworks') || '[]')
    const updated = homeworks.map(({ classId: _, ...rest }) => rest)
    localStorage.setItem('phf_homeworks', JSON.stringify(updated))
  } catch (e) {
    console.error('Migration v1→v2 step 4 failed:', e)
  }

  // 5: convert homework progress numbers → strings
  try {
    const homeworks = JSON.parse(localStorage.getItem('phf_homeworks') || '[]')
    const progressMap = { 0: 'not_done', 50: 'in_progress', 100: 'done' }
    const updated = homeworks.map(h => ({
      ...h,
      progress: typeof h.progress === 'number'
        ? (progressMap[h.progress] ?? 'not_done')
        : h.progress,
    }))
    localStorage.setItem('phf_homeworks', JSON.stringify(updated))
  } catch (e) {
    console.error('Migration v1→v2 step 5 failed:', e)
  }
}

export const runMigrations = () => {
  const version = getVersion()
  if (version < 2) {
    migrateV1toV2()
    setVersion(2)
  }
}
