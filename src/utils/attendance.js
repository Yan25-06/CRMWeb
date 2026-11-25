// Logic điểm danh thuần (không import React/supabase) — test bằng
// `node scripts/test-attendance.mjs`.
//
// Mô hình "mặc định có mặt": thiếu bản ghi attendance = có mặt. Vì vậy phải
// giới hạn buổi theo thời gian học sinh thực sự ở trong lớp, nếu không học sinh
// vào lớp muộn sẽ được tính "có mặt" ở mọi buổi trước khi vào.

const pad = (n) => String(n).padStart(2, '0')

// Ngày theo giờ ĐỊA PHƯƠNG dạng 'YYYY-MM-DD'.
// Nhận chuỗi ngày 'YYYY-MM-DD' (giữ nguyên), ISO timestamp, hoặc Date.
// Không dùng `iso.split('T')[0]`: đó là ngày UTC — ghi danh lúc 6h sáng giờ VN
// sẽ bị lùi về hôm trước.
export const toDateKey = (value) => {
  if (!value) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const todayKey = () => toDateKey(new Date())

// 'YYYY-MM-DD' (giờ địa phương) → ISO timestamp lưu vào `enrolled_at`.
// Chọn hôm nay → giữ giờ hiện tại; ngày khác → 00:00 địa phương của ngày đó.
export const dateKeyToISO = (dateKey) => {
  if (!dateKey || dateKey === todayKey()) return new Date().toISOString()
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toISOString()
}

// Buổi học (theo ngày) có áp dụng cho học sinh với enrollment này không.
// - Trước ngày vào lớp (`enrolledAt`) → không áp dụng.
// - Sau ngày nghỉ (`droppedAt`) → không áp dụng.
// - `hasRecord`: đã có bản ghi điểm danh tường minh cho buổi đó → LUÔN áp dụng
//   (bản ghi là bằng chứng học sinh có trong buổi; giữ đúng dữ liệu cũ khi ngày
//   vào lớp bị ghi muộn hơn thực tế).
// - Không có enrollment → áp dụng (không đủ thông tin để loại).
export const isSessionApplicable = (sessionDate, enrollment, hasRecord = false) => {
  if (hasRecord) return true
  if (!enrollment || !sessionDate) return true
  const start = toDateKey(enrollment.enrolledAt)
  if (start && sessionDate < start) return false
  const end = toDateKey(enrollment.droppedAt)
  if (end && sessionDate > end) return false
  return true
}

// Tổng hợp chuyên cần của 1 học sinh trên danh sách buổi.
// sessions: [{ id, date }] — caller tự lọc trước (buổi đã qua / khoảng ngày).
// getRecord(sessionId) → bản ghi `{ present }` hoặc undefined.
// Trả { total, present, absent, absentDates (tăng dần), rate (0..1 | null) }.
export const summarizeAttendance = (sessions, enrollment, getRecord) => {
  let total = 0
  let present = 0
  const absentDates = []
  for (const s of sessions) {
    const rec = getRecord(s.id)
    if (!isSessionApplicable(s.date, enrollment, rec != null)) continue
    total++
    if (rec?.present === false) absentDates.push(s.date)
    else present++
  }
  absentDates.sort((a, b) => a.localeCompare(b))
  return {
    total,
    present,
    absent: total - present,
    absentDates,
    rate: total > 0 ? present / total : null,
  }
}
