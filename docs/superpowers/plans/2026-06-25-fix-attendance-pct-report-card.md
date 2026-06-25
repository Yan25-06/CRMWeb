# Fix Attendance Pct Report Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đồng bộ % chuyên cần trên phiếu nhận xét (đơn lẻ + hàng loạt) với bảng Điểm Danh trong trang nhận xét bằng cách gom logic tính vào một method dùng chung.

**Architecture:** Thêm `attendanceService.getRateByRange` dùng mô hình "mặc định có mặt" (mẫu số = số buổi học, không phải số bản ghi). ReviewsPage và BulkExportModal thay thế công thức tự tính sai bằng method này. AttendancePanel cũng refactor dùng cùng method để ba nơi không bao giờ lệch.

**Tech Stack:** React 18, Supabase (`@supabase/supabase-js`), Vite. Không có test runner — kiểm thử bằng `npm run dev`.

---

### Task 1: Thêm `attendanceService.getRateByRange`

**Files:**
- Modify: `src/services/attendanceService.js` (thêm method mới cuối object)

- [ ] **Step 1: Đọc file hiện tại để nắm context**

  Đọc `src/services/attendanceService.js` — chú ý method `getByRange` (dòng 51–71) và `getRate` (118–131). Method mới sẽ kết hợp logic của cả hai nhưng theo khoảng.

- [ ] **Step 2: Thêm method `getRateByRange` vào `attendanceService`**

  Thêm sau method `getByClassRange`, trước dấu `}` đóng object (dòng cuối file):

  ```js
  // Attendance rate (%) for a student within a class, scoped by date range.
  // Uses "present-by-default" model: denominator = session count, not record count.
  // Returns { present, total, pct } where pct is rounded to 1 decimal, or null when total === 0.
  async getRateByRange(studentId, classId, fromDate, toDate) {
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id')
      .eq('class_id', classId)
      .gte('date', fromDate)
      .lte('date', toDate)
    if (sessErr) throw new Error(sessErr.message)
    const total = (sessions ?? []).length
    if (total === 0) return null
    const sessionIds = sessions.map(s => s.id)
    const { data, error } = await supabase
      .from('attendance')
      .select('present')
      .eq('student_id', studentId)
      .in('session_id', sessionIds)
    if (error) throw new Error(error.message)
    const absent = (data ?? []).filter(r => r.present === false).length
    const present = total - absent
    return { present, total, pct: Math.round((present / total) * 1000) / 10 }
  },
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/services/attendanceService.js
  git commit -m "feat(attendance): add getRateByRange — present-by-default model"
  ```

---

### Task 2: Sửa ReviewsPage — phiếu đơn lẻ

**Files:**
- Modify: `src/pages/ReviewsPage.jsx` (khoảng dòng 261–284)

- [ ] **Step 1: Đọc đoạn cần sửa**

  Đọc `src/pages/ReviewsPage.jsx` từ dòng 258 đến 285. Tìm `useEffect` gọi `attendanceService.getByRange` + tính tay `present / attRecs.length`.

- [ ] **Step 2: Thay khối tính chuyên cần**

  Hiện tại (sai):
  ```js
  Promise.all([
    attendanceService.getByRange(selectedStudentId, selectedClassId, dateRange.fromDate, dateRange.toDate),
    homeworkService.getByRange(selectedStudentId, selectedClassId, dateRange.fromDate, dateRange.toDate),
  ]).then(([attRecs, hwRecs]) => {
    if (attRecs.length) {
      const present = attRecs.filter(r => r.present !== false).length
      setAttendancePct(Math.round((present / attRecs.length) * 1000) / 10)
    } else {
      setAttendancePct(null)
    }
    if (hwRecs.length) {
  ```

  Thay bằng (đúng):
  ```js
  Promise.all([
    attendanceService.getRateByRange(selectedStudentId, selectedClassId, dateRange.fromDate, dateRange.toDate),
    homeworkService.getByRange(selectedStudentId, selectedClassId, dateRange.fromDate, dateRange.toDate),
  ]).then(([attRate, hwRecs]) => {
    setAttendancePct(attRate?.pct ?? null)
    if (hwRecs.length) {
  ```

  Lưu ý: phần xử lý `hwRecs` và `.catch` phía sau **giữ nguyên không đổi**.

- [ ] **Step 3: Kiểm tra thủ công**

  ```bash
  npm run dev
  ```

  - Vào trang **Nhận Xét**, chọn Kim Khánh / TOEIC 02.
  - So sánh % ở bảng Điểm Danh (AttendancePanel) với % trong modal xem trước phiếu → phải bằng nhau (75%).
  - Nhấn "Tải PDF" / "Tải Ảnh" → kiểm tra số trên ảnh.

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/ReviewsPage.jsx
  git commit -m "fix(reviews): dùng getRateByRange cho % chuyên cần trên phiếu đơn lẻ"
  ```

---

### Task 3: Sửa BulkExportModal — phiếu hàng loạt

**Files:**
- Modify: `src/components/reviews/BulkExportModal.jsx` (khoảng dòng 14, 22–25)

- [ ] **Step 1: Đọc đoạn cần sửa**

  Đọc `src/components/reviews/BulkExportModal.jsx` từ dòng 1 đến 45. Tìm hàm helper nội bộ (thường là async IIFE hoặc hàm `buildStudentData`) gọi `attendanceService.getByRange` rồi tính `present / attRecs.length`.

- [ ] **Step 2: Thay khối tính chuyên cần**

  Hiện tại (sai, ~dòng 14 và 22–25):
  ```js
  attendanceService.getByRange(student.id, classId, dateRange.fromDate, dateRange.toDate),
  // ...
  let attendancePct = null
  if (attRecs.length) {
    const present = attRecs.filter(r => r.present !== false).length
    attendancePct = Math.round((present / attRecs.length) * 1000) / 10
  }
  ```

  Thay bằng (đúng):
  ```js
  attendanceService.getRateByRange(student.id, classId, dateRange.fromDate, dateRange.toDate),
  // ...
  const attendancePct = attRate?.pct ?? null
  ```

  Biến `attRecs` trong destructure `[attRecs, hwRecs]` đổi thành `[attRate, hwRecs]`. Toàn bộ block `if (attRecs.length) { ... }` tính `attendancePct` bị xóa, thay bằng một dòng.

  Phần homework giữ nguyên không đổi.

- [ ] **Step 3: Kiểm tra thủ công**

  - Vẫn để dev server chạy từ Task 2.
  - Vào trang Nhận Xét → nút **"Xuất Hàng Loạt"** → xuất thử → mở file ZIP → xem % chuyên cần trên ảnh của Kim Khánh → phải là 75%.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/reviews/BulkExportModal.jsx
  git commit -m "fix(reviews): dùng getRateByRange cho % chuyên cần trên phiếu hàng loạt"
  ```

---

### Task 4: Refactor AttendancePanel — dùng chung một nguồn logic

**Files:**
- Modify: `src/components/reviews/AttendancePanel.jsx`

- [ ] **Step 1: Đọc file**

  Đọc `src/components/reviews/AttendancePanel.jsx`. Chú ý:
  - `useMemo` tính `total`, `present`, `pct` từ `items` (dòng 39–52).
  - `useEffect` fetch `sessionService.getByClass` + `attendanceService.getByRange` (dòng 24–37).

- [ ] **Step 2: Refactor — vẫn fetch danh sách để render, tính pct từ getRateByRange**

  Thêm import nếu chưa có (thường `attendanceService` đã import). Thêm state `ratePct`:

  ```js
  const [ratePct, setRatePct] = useState(null)
  ```

  Thêm `getRateByRange` vào `Promise.all` trong `useEffect`:

  ```js
  Promise.all([
    sessionService.getByClass(classId),
    attendanceService.getByRange(studentId, classId, fromDate, toDate),
    attendanceService.getRateByRange(studentId, classId, fromDate, toDate),
  ])
    .then(([allSessions, recs, rate]) => {
      if (cancelled) return
      setSessions(allSessions.filter(s => s.date >= fromDate && s.date <= toDate))
      setRecords(recs)
      setRatePct(rate?.pct ?? null)
    })
    .catch(() => { if (!cancelled) { setSessions([]); setRecords([]); setRatePct(null) } })
  ```

  Trong JSX, thay `pct` (tính từ useMemo) bằng `ratePct` ở những chỗ hiển thị tỷ lệ phần trăm (header chip + text "X% chuyên cần"). Giữ `total`/`present` từ useMemo cho text "X/Y buổi".

  `useMemo` vẫn giữ để tính `items` (danh sách render) và `total`/`present` cho text — chỉ bỏ `pct` ra khỏi useMemo.

  Cụ thể: trong `useMemo`, xóa dòng `const pct = ...`. Đổi mọi `{pct}` trong JSX thành `{ratePct}`, mọi `pct >= 80` thành `ratePct >= 80`, etc.

  Trường hợp `total === 0` (không có session): component vẫn render "Chưa có dữ liệu" như cũ vì guard `if (total === 0)` dùng `total` từ `items.length` — không đổi.

- [ ] **Step 3: Kiểm tra thủ công**

  - Trong trang Nhận Xét, xác nhận bảng Điểm Danh vẫn hiện đúng danh sách buổi + % 75% như trước.
  - Đổi khoảng ngày → % cập nhật đúng theo khoảng mới.
  - Học viên không có buổi nào trong khoảng → hiện "Chưa có dữ liệu điểm danh".

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/reviews/AttendancePanel.jsx
  git commit -m "refactor(attendance): AttendancePanel dùng getRateByRange — đồng bộ nguồn logic"
  ```

---

## Checklist tự review

- [x] Task 1 thêm `getRateByRange` trả `{ present, total, pct }` hoặc `null`
- [x] Task 2 dùng `attRate?.pct ?? null` (null-safe cho trường hợp không có buổi)
- [x] Task 3 dùng cùng pattern
- [x] Task 4 không phá vỡ render danh sách buổi của AttendancePanel
- [x] Tên method nhất quán: `getRateByRange` xuyên suốt 4 task
- [x] `getByRange` cũ vẫn còn (AttendancePanel vẫn cần để fetch danh sách)
- [x] `getRate` all-time không đụng đến
