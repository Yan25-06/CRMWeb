# Phiếu phụ huynh đẹp hơn + Lương GV theo buổi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm phiếu nhận xét phụ huynh dễ đọc & chi tiết hơn (sửa bug xuống dòng, liệt kê buổi vắng/bài chưa làm, làm đẹp UI), và đổi lương giáo viên sang tính theo đơn giá/buổi thay vì lương tháng.

**Architecture:** Phiếu render qua component dùng chung `ReportCardContent` (3 caller: ReviewsPage→ReportCardModal, BulkExportModal). Dữ liệu chuyên cần lấy từ `attendanceService.getRateByRange` (mở rộng để trả ngày vắng); bài tập từ `homeworkService.getByRange` (đã có ngày). Lương tính bằng hàm thuần `payroll.js`, đổi từ `monthlySalary/scheduled` sang `sessionRate` trực tiếp, cần migration thêm cột `teachers.session_rate`.

**Tech Stack:** React 18 + Vite, Tailwind (navy tokens), Supabase (Postgres + RLS), html2canvas/jspdf/jszip cho export. KHÔNG có test runner → kiểm thử bằng `npm run build` + chạy `npm run dev` quan sát thủ công.

---

## Quy ước kiểm thử (đọc trước)

Dự án không có test tự động. Mỗi task "kiểm thử" = chạy lệnh build và (khi cần) quan sát UI:
- `npm run build` phải PASS (không lỗi cú pháp/import).
- Quan sát thủ công nêu rõ trong từng task.

Commit sau mỗi task. Branch hiện tại: `main` — tạo nhánh mới trước khi bắt đầu:

```bash
git checkout -b feat/report-card-and-per-session-payroll
```

---

# PHẦN 1 — Phiếu phụ huynh

## Task 1: Sửa bug xuống dòng trong phiếu

**Files:**
- Modify: `src/components/reviews/ReportCardModal.jsx` (trong `ReportCardContent`)

- [ ] **Step 1: Thêm `whitespace-pre-wrap` cho 3 khối text**

Trong `ReportCardContent`, sửa 3 thẻ `<p>` hiển thị text tự do của giáo viên.

Khối Ghi Chú (remark) — đổi:
```jsx
              <p className="text-sm text-navy-700">{latestReview.remark}</p>
```
thành:
```jsx
              <p className="text-sm text-navy-700 whitespace-pre-wrap">{latestReview.remark}</p>
```

Khối Lời Khuyên (advice) — đổi:
```jsx
              <p className="text-sm text-navy-700">{latestReview.advice}</p>
```
thành:
```jsx
              <p className="text-sm text-navy-700 whitespace-pre-wrap">{latestReview.advice}</p>
```

Khối Nhận Xét Tổng Kết (generalComment) — đổi:
```jsx
              <p className="text-sm text-navy-700">{generalComment.text}</p>
```
thành:
```jsx
              <p className="text-sm text-navy-700 whitespace-pre-wrap">{generalComment.text}</p>
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/reviews/ReportCardModal.jsx
git commit -m "fix(report-card): giữ xuống dòng trong nhận xét/lời khuyên/tổng kết"
```

---

## Task 2: Mở rộng `getRateByRange` trả về ngày vắng

**Files:**
- Modify: `src/services/attendanceService.js:133-153`

- [ ] **Step 1: Sửa query lấy thêm `date` của session vắng**

Thay toàn bộ method `getRateByRange` bằng:

```js
  async getRateByRange(studentId, classId, fromDate, toDate) {
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id, date')
      .eq('class_id', classId)
      .gte('date', fromDate)
      .lte('date', toDate)
    if (sessErr) throw new Error(sessErr.message)
    const total = (sessions ?? []).length
    if (total === 0) return null
    const sessionIds = sessions.map(s => s.id)
    const dateById = new Map(sessions.map(s => [s.id, s.date]))
    const { data, error } = await supabase
      .from('attendance')
      .select('session_id, present')
      .eq('student_id', studentId)
      .in('session_id', sessionIds)
    if (error) throw new Error(error.message)
    const absentRows = (data ?? []).filter(r => r.present === false)
    const absentDates = absentRows
      .map(r => dateById.get(r.session_id))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
    const absent = absentRows.length
    const present = total - absent
    return { present, total, pct: Math.round((present / total) * 1000) / 10, absentDates }
  },
```

> Lưu ý: trước đây query chỉ `select('present')`. Giờ cần `session_id` để map ngày. Field cũ `present/total/pct` giữ nguyên → mọi caller cũ (AttendancePanel, ReviewsPage, BulkExportModal) không vỡ.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/services/attendanceService.js
git commit -m "feat(attendance): getRateByRange trả thêm absentDates"
```

---

## Task 3: `ReportCardContent` nhận & hiển thị chi tiết chuyên cần + bài tập

**Files:**
- Modify: `src/components/reviews/ReportCardModal.jsx`

Thiết kế props mới (thay 2 prop cũ `attendancePct`/`homeworkPct` bằng object chi tiết, nhưng GIỮ backward-compat bằng cách chấp nhận cả hai — đơn giản hơn: thêm 2 prop mới `attendanceDetail`, `homeworkDetail`, vẫn nhận `attendancePct`/`homeworkPct` làm fallback).

- [ ] **Step 1: Thêm helper format danh sách ngày (đầu file, sau `fmtDate`)**

```jsx
// '2026-06-05' -> '5/6'
const fmtDayShort = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
```

- [ ] **Step 2: Đổi signature `ReportCardContent` thêm 2 prop**

Đổi dòng:
```jsx
export const ReportCardContent = ({ student, cls, latestReview, settings = {}, dateRange, attendancePct, homeworkPct, generalComment }) => {
```
thành:
```jsx
export const ReportCardContent = ({ student, cls, latestReview, settings = {}, dateRange, attendancePct, homeworkPct, attendanceDetail, homeworkDetail, generalComment }) => {
  // Ưu tiên detail; fallback về pct cũ nếu caller chưa truyền detail.
  const attPct = attendanceDetail?.pct ?? attendancePct
  const attPresent = attendanceDetail?.present
  const attTotal = attendanceDetail?.total
  const attAbsentDates = attendanceDetail?.absentDates ?? []
  const hwPct = homeworkDetail?.pct ?? homeworkPct
  const hwDone = homeworkDetail?.done
  const hwTotal = homeworkDetail?.total
  const hwMissing = homeworkDetail?.missing ?? []
```

> Phần thân hàm tiếp tục như cũ. Các biến `attendancePct`/`homeworkPct` bên dưới sẽ được thay bằng `attPct`/`hwPct` ở Step 3.

- [ ] **Step 3: Thay khối 2 card chuyên cần/bài tập**

Tìm khối hiện tại:
```jsx
          {(attendancePct != null || homeworkPct != null) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-navy-50 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-navy-500 mb-1">Chuyên cần</p>
                <p className="text-xl font-bold text-navy-800">{attendancePct != null ? `${attendancePct}%` : '—'}</p>
              </div>
              <div className="bg-navy-50 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-navy-500 mb-1">Bài tập</p>
                <p className="text-xl font-bold text-navy-800">{homeworkPct != null ? `${homeworkPct}%` : '—'}</p>
              </div>
            </div>
          )}
```

Thay bằng:
```jsx
          {(attPct != null || hwPct != null) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-navy-50 rounded-xl px-4 py-3">
                <p className="text-xs text-navy-500 mb-1 text-center">Chuyên cần</p>
                <p className="text-2xl font-bold text-navy-800 text-center">{attPct != null ? `${attPct}%` : '—'}</p>
                {attTotal != null && (
                  <p className="text-xs text-navy-500 text-center mt-0.5">{attPresent}/{attTotal} buổi</p>
                )}
                {attAbsentDates.length > 0 && (
                  <p className="text-xs text-red-600 mt-1.5 leading-snug">
                    Vắng: {attAbsentDates.map(fmtDayShort).join(', ')}
                  </p>
                )}
              </div>
              <div className="bg-navy-50 rounded-xl px-4 py-3">
                <p className="text-xs text-navy-500 mb-1 text-center">Bài tập</p>
                <p className="text-2xl font-bold text-navy-800 text-center">{hwPct != null ? `${hwPct}%` : '—'}</p>
                {hwTotal != null && (
                  <p className="text-xs text-navy-500 text-center mt-0.5">{hwDone}/{hwTotal} buổi</p>
                )}
                {hwMissing.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1.5 leading-snug">
                    Chưa hoàn thành: {hwMissing.map(m => m.sessionTopic ? `${fmtDayShort(m.date)} (${m.sessionTopic})` : fmtDayShort(m.date)).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/reviews/ReportCardModal.jsx
git commit -m "feat(report-card): hiển thị chi tiết buổi vắng + bài chưa hoàn thành"
```

---

## Task 4: ReviewsPage tính & truyền `attendanceDetail` + `homeworkDetail`

**Files:**
- Modify: `src/pages/ReviewsPage.jsx:258-279` (state + effect), `:524-535` (ReportCardModal props)

- [ ] **Step 1: Đổi state + effect lấy detail**

Thay khối state (dòng 258-259):
```jsx
  const [attendancePct, setAttendancePct] = useState(null)
  const [homeworkPct,   setHomeworkPct]   = useState(null)
```
bằng:
```jsx
  const [attendanceDetail, setAttendanceDetail] = useState(null)
  const [homeworkDetail,   setHomeworkDetail]   = useState(null)
```

Thay khối effect (dòng 261-279):
```jsx
  useEffect(() => {
    if (!selectedStudentId || !selectedClassId) { setAttendanceDetail(null); setHomeworkDetail(null); return }
    Promise.all([
      attendanceService.getRateByRange(selectedStudentId, selectedClassId, dateRange.fromDate, dateRange.toDate),
      homeworkService.getByRange(selectedStudentId, selectedClassId, dateRange.fromDate, dateRange.toDate),
    ]).then(([attRate, hwRecs]) => {
      setAttendanceDetail(attRate
        ? { pct: attRate.pct, present: attRate.present, total: attRate.total, absentDates: attRate.absentDates ?? [] }
        : null)
      if (hwRecs.length) {
        let done = 0, inProg = 0
        const missing = []
        hwRecs.forEach(r => {
          if (r.progress === 'done' || r.progress === 100) done++
          else {
            if (r.progress === 'in_progress' || r.progress === 50) inProg++
            missing.push({ date: r.date, sessionTopic: r.sessionTopic })
          }
        })
        missing.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        setHomeworkDetail({
          pct: Math.round((done * 100 + inProg * 50) / hwRecs.length),
          done,
          total: hwRecs.length,
          missing,
        })
      } else {
        setHomeworkDetail(null)
      }
    }).catch(() => { setAttendanceDetail(null); setHomeworkDetail(null) })
  }, [selectedStudentId, selectedClassId, dateRange.fromDate, dateRange.toDate])
```

- [ ] **Step 2: Cập nhật props ReportCardModal**

Thay (dòng 532-533):
```jsx
        attendancePct={attendancePct}
        homeworkPct={homeworkPct}
```
bằng:
```jsx
        attendanceDetail={attendanceDetail}
        homeworkDetail={homeworkDetail}
```

- [ ] **Step 3: Truyền props qua `ReportCardModal` → `ReportCardContent`**

Mở `src/components/reviews/ReportCardModal.jsx`. Trong component `ReportCardModal` (signature dòng ~149), đổi:
```jsx
export const ReportCardModal = ({ open, onClose, student, cls, latestReview, settings = {}, dateRange, attendancePct, homeworkPct, generalComment }) => {
```
thành:
```jsx
export const ReportCardModal = ({ open, onClose, student, cls, latestReview, settings = {}, dateRange, attendanceDetail, homeworkDetail, generalComment }) => {
```

Và trong JSX render `<ReportCardContent ... />` bên trong modal (dòng ~204), đổi:
```jsx
              attendancePct={attendancePct}
              homeworkPct={homeworkPct}
```
thành:
```jsx
              attendanceDetail={attendanceDetail}
              homeworkDetail={homeworkDetail}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Kiểm thử thủ công**

Run: `npm run dev` → mở trang Đánh Giá → chọn học sinh có buổi vắng + bài chưa làm → mở "Phiếu Kết Quả" → xác nhận card Chuyên cần hiện "X/Y buổi" + "Vắng: …", card Bài tập hiện "Chưa hoàn thành: …".

- [ ] **Step 6: Commit**

```bash
git add src/pages/ReviewsPage.jsx src/components/reviews/ReportCardModal.jsx
git commit -m "feat(reviews): truyền chi tiết chuyên cần + bài tập vào phiếu"
```

---

## Task 5: BulkExportModal tính `homeworkMissing` + truyền detail

**Files:**
- Modify: `src/components/reviews/BulkExportModal.jsx:10-34` (loadStudentData), `:146-155` (props ReportCardContent)

- [ ] **Step 1: Sửa `loadStudentData` trả detail**

Thay toàn bộ hàm `loadStudentData` (dòng 10-35) bằng:

```jsx
const loadStudentData = async (student, cls, dateRange) => {
  const classId = cls?.id
  const [reviews, attRate, hwRecs, comment] = await Promise.all([
    reviewService.getByStudent(student.id, classId),
    attendanceService.getRateByRange(student.id, classId, dateRange.fromDate, dateRange.toDate),
    homeworkService.getByRange(student.id, classId, dateRange.fromDate, dateRange.toDate),
    generalCommentService.get(student.id, classId),
  ])

  const reviewsInRange = reviews.filter(r => r.date >= dateRange.fromDate && r.date <= dateRange.toDate)
  const latestReview = reviewsInRange[0] ?? null

  const attendanceDetail = attRate
    ? { pct: attRate.pct, present: attRate.present, total: attRate.total, absentDates: attRate.absentDates ?? [] }
    : null

  let homeworkDetail = null
  if (hwRecs.length) {
    let done = 0, inProg = 0
    const missing = []
    hwRecs.forEach(r => {
      if (r.progress === 'done' || r.progress === 100) done++
      else {
        if (r.progress === 'in_progress' || r.progress === 50) inProg++
        missing.push({ date: r.date, sessionTopic: r.sessionTopic })
      }
    })
    missing.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    homeworkDetail = {
      pct: Math.round((done * 100 + inProg * 50) / hwRecs.length),
      done,
      total: hwRecs.length,
      missing,
    }
  }

  return { student, latestReview, attendanceDetail, homeworkDetail, generalComment: comment }
}
```

- [ ] **Step 2: Cập nhật props khi render `ReportCardContent`**

Thay (dòng ~152-153):
```jsx
              attendancePct={currentData.attendancePct}
              homeworkPct={currentData.homeworkPct}
```
bằng:
```jsx
              attendanceDetail={currentData.attendanceDetail}
              homeworkDetail={currentData.homeworkDetail}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Kiểm thử thủ công**

Run: `npm run dev` → trang Đánh Giá → "Xuất Phiếu Hàng Loạt" → mở 1 file PNG trong zip → xác nhận chi tiết buổi vắng/bài chưa làm xuất hiện.

- [ ] **Step 5: Commit**

```bash
git add src/components/reviews/BulkExportModal.jsx
git commit -m "feat(bulk-export): chi tiết chuyên cần + bài tập trong phiếu hàng loạt"
```

---

## Task 6: Làm đẹp phần Điểm Kỹ Năng + Footer ký tên

**Files:**
- Modify: `src/components/reviews/ReportCardModal.jsx` (khối Điểm Kỹ Năng + Footer trong `ReportCardContent`)

- [ ] **Step 1: Tách label/điểm sang dòng riêng + màu theo mức + thanh dày hơn**

Tìm khối render mỗi skill (trong IIFE Điểm Kỹ Năng):
```jsx
                    return (
                      <div key={skill.name} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-navy-600">{skill.name}</span>
                          <span className="text-sm font-bold text-navy-800">{score}/{maxScore}</span>
                        </div>
                        <div className="h-1.5 bg-navy-100 rounded-full overflow-hidden">
                          <div className="h-full bg-navy-600 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    )
```

Thay bằng (thanh dày `h-2.5`, màu theo %):
```jsx
                    const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-navy-600' : 'bg-amber-500'
                    return (
                      <div key={skill.name} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm font-medium text-navy-700">{skill.name}</span>
                          <span className="text-base font-bold text-navy-900">{score}<span className="text-xs font-normal text-navy-400">/{maxScore}</span></span>
                        </div>
                        <div className="h-2.5 bg-navy-100 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    )
```

> Lưu ý: `const barColor` đặt TRƯỚC `return` — trong arrow `.map()` đang dùng dạng `return (...)`, nên thêm dòng `const barColor = ...` ngay trên `return`. Biến `pct` đã tồn tại phía trên trong cùng callback.

- [ ] **Step 2: Footer thêm 2 ô ký tên**

Tìm khối Footer hiện tại:
```jsx
          {/* Footer */}
          <div className="border-t border-navy-100 pt-3 flex justify-between text-xs text-navy-400">
            <span>Ngày lập: {new Date().toLocaleDateString('vi-VN')}</span>
            <span>Giáo viên: {latestReview.teacherName || settings.teacherName || '—'}</span>
          </div>
```

Thay bằng:
```jsx
          {/* Footer: ngày lập + 2 ô ký tên */}
          <div className="border-t border-navy-100 pt-3 flex flex-col gap-4">
            <p className="text-xs text-navy-400">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</p>
            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="text-center">
                <p className="text-xs font-semibold text-navy-600">Giáo viên</p>
                <p className="text-xs text-navy-400 italic mt-0.5">{latestReview.teacherName || settings.teacherName || ''}</p>
                <div className="border-t border-dashed border-navy-200 mt-8" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-navy-600">Phụ huynh</p>
                <p className="text-xs text-navy-400 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
                <div className="border-t border-dashed border-navy-200 mt-8" />
              </div>
            </div>
          </div>
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Kiểm thử thủ công**

Run: `npm run dev` → mở phiếu → xác nhận Điểm Kỹ Năng có thanh dày + màu theo mức, footer có 2 ô ký tên. Xuất PDF kiểm tra layout không vỡ.

- [ ] **Step 5: Commit**

```bash
git add src/components/reviews/ReportCardModal.jsx
git commit -m "style(report-card): điểm kỹ năng rõ hơn + footer ký tên giáo viên/phụ huynh"
```

---

# PHẦN 2 — Lương giáo viên theo buổi

## Task 7: Migration thêm cột `teachers.session_rate`

**Files:**
- Create: `supabase/migrations/20260627000001_add_teacher_session_rate.sql`

- [ ] **Step 1: Viết migration**

```sql
-- =========================================================================
-- Migration: Teacher per-session rate (đơn giá lương theo buổi)
-- Change: per-session-payroll
--
-- - teachers.session_rate: đơn giá mỗi buổi (admin set). Thay model lương tháng.
-- - monthly_salary giữ orphan (không drop) để tránh rủi ro; app ngừng dùng.
-- - Trigger prevent_salary_change mở rộng: chặn GV thường đổi cả session_rate.
--
-- Rollback:
--   alter table public.teachers drop column session_rate;
--   create or replace function public.prevent_salary_change()
--     returns trigger language plpgsql security definer as $$
--     begin
--       if new.monthly_salary is distinct from old.monthly_salary then
--         if not is_admin() then
--           raise exception 'permission denied: monthly_salary can only be changed by admin';
--         end if;
--       end if;
--       return new;
--     end; $$;
-- =========================================================================

alter table public.teachers
  add column if not exists session_rate numeric;

-- Mở rộng trigger: chỉ admin được đổi monthly_salary HOẶC session_rate.
create or replace function public.prevent_salary_change()
  returns trigger language plpgsql security definer as $$
begin
  if (new.monthly_salary is distinct from old.monthly_salary)
     or (new.session_rate is distinct from old.session_rate) then
    if not is_admin() then
      raise exception 'permission denied: salary/session_rate can only be changed by admin';
    end if;
  end if;
  return new;
end;
$$;

-- Trigger trg_prevent_salary_change đã tồn tại (migration 20260622000001)
-- và trỏ tới cùng function name → không cần tạo lại.
```

- [ ] **Step 2: Áp dụng migration**

Mở Supabase SQL Editor, dán nội dung file, Run. Expected: success, không lỗi.

> Nếu dùng Supabase CLI local: `supabase db push` (tùy cấu hình dự án). Mặc định dự án này chạy thủ công qua SQL Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260627000001_add_teacher_session_rate.sql
git commit -m "feat(db): thêm teachers.session_rate + chặn GV thường đổi đơn giá"
```

---

## Task 8: teacherService dùng `sessionRate`

**Files:**
- Modify: `src/services/classService.js:68-102` (teacherService)

- [ ] **Step 1: Sửa `getAll` + `update`**

Trong `teacherService.getAll`, đổi select và mapping:
```js
      .select('id, name, email, is_admin, monthly_salary')
```
thành:
```js
      .select('id, name, email, is_admin, session_rate')
```
và đổi dòng mapping:
```js
      monthlySalary: t.monthly_salary ?? null,
```
thành:
```js
      sessionRate: t.session_rate ?? null,
```

Trong `teacherService.update`, đổi:
```js
  async update(id, { name, monthlySalary }) {
    const payload = {}
    if (name !== undefined) payload.name = name
    if (monthlySalary !== undefined) payload.monthly_salary = monthlySalary
```
thành:
```js
  async update(id, { name, sessionRate }) {
    const payload = {}
    if (name !== undefined) payload.name = name
    if (sessionRate !== undefined) payload.session_rate = sessionRate
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS (lỗi import/biến chưa định nghĩa nếu còn `monthlySalary` ở nơi khác — sẽ sửa ở Task 9-10).

> Build có thể vẫn PASS vì JS không kiểm prop tĩnh; lỗi runtime sẽ lộ khi chạy. Task 9-10 cập nhật các caller.

- [ ] **Step 3: Commit**

```bash
git add src/services/classService.js
git commit -m "feat(teacher-service): đổi monthlySalary -> sessionRate"
```

---

## Task 9: payroll.js tính theo đơn giá/buổi

**Files:**
- Modify: `src/utils/payroll.js`

- [ ] **Step 1: Viết lại header comment + `buildPayrollRows`**

Thay khối comment đầu file (dòng 1-6) bằng:
```js
// Tính lương giáo viên theo BUỔI — hàm THUẦN (không gọi supabase).
// Công thức (spec 2026-06-27, per-session model):
//   rate (đơn giá/buổi) = sessionRate (admin nhập trực tiếp)
//   actualPay = rate * (taught + subs)
//   taught = đếm record status='present' (opt-in: chỉ xác nhận dạy mới tính)
//   subs = đếm dạy thay đã xác nhận (substituteConfirmed=true), theo rate của
//          chính người dạy thay.
//   scheduled = số buổi theo lịch trong tháng (chỉ để hiển thị tham khảo).
```

- [ ] **Step 2: Sửa JSDoc + thân `buildPayrollRows`**

Đổi dòng JSDoc input teachers:
```js
// teachers: [{ id, name, email, monthlySalary }]
```
thành:
```js
// teachers: [{ id, name, email, sessionRate }]
```
và dòng output:
```js
// Trả: [{ teacherId, name, base, scheduled, absent, taught, subs, rate, actualPay }]
```
thành:
```js
// Trả: [{ teacherId, name, scheduled, absent, taught, subs, rate, actualPay }]
```

Thay khối `return teachers.map(...)` (dòng 56-75) bằng:
```js
  return teachers.map(t => {
    const rate = t.sessionRate ?? 0
    const scheduled = scheduledByTeacher.get(t.id) ?? 0
    const absent = absentByTeacher.get(t.id) ?? 0
    const taught = taughtByTeacher.get(t.id) ?? 0
    const subs = subsByTeacher.get(t.id) ?? 0
    const actualPay = Math.round(rate * (taught + subs))
    return {
      teacherId: t.id,
      name: t.name || t.email || '—',
      scheduled,
      absent,
      taught,
      subs,
      rate: Math.round(rate),
      actualPay,
    }
  })
```

> Bỏ `base` và bỏ phép chia `rate = base / scheduled`. `scheduledByTeacher` vẫn được tính như cũ (giữ nguyên các dòng phía trên).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/utils/payroll.js
git commit -m "feat(payroll): tính lương theo đơn giá/buổi thay vì lương tháng"
```

---

## Task 10: PayrollTab — cột "Đơn giá/buổi"

**Files:**
- Modify: `src/components/schedule/PayrollTab.jsx`

- [ ] **Step 1: Sửa `selfTeacher` đọc session_rate**

Đổi (dòng ~46):
```jsx
        monthlySalary: teacher.monthly_salary ?? null,
```
thành:
```jsx
        sessionRate: teacher.session_rate ?? null,
```

- [ ] **Step 2: Sửa cột Excel**

Đổi mảng `excelColumns`:
```jsx
    { key: 'baseFmt', label: 'Lương tháng' },
```
thành:
```jsx
    { key: 'rateFmt', label: 'Đơn giá/buổi' },
```
Và xóa dòng trùng `{ key: 'rateFmt', label: 'Đơn giá/buổi' }` cũ (gần cuối mảng) để không lặp cột. Mảng `excelColumns` cuối cùng:
```jsx
  const excelColumns = [
    { key: 'name', label: 'Giáo viên' },
    { key: 'rateFmt', label: 'Đơn giá/buổi' },
    { key: 'scheduled', label: 'Buổi theo lịch' },
    { key: 'taught', label: 'Đã dạy' },
    { key: 'absent', label: 'Vắng' },
    { key: 'pending', label: 'Chưa xác nhận' },
    { key: 'subs', label: 'Dạy thay' },
    { key: 'payFmt', label: 'Thực nhận' },
  ]
```

Sửa `excelRows` — bỏ `baseFmt`:
```jsx
  const excelRows = rows.map(r => ({
    ...r,
    pending: Math.max(0, r.scheduled - r.taught - r.absent),
    rateFmt: fmtVND(r.rate),
    payFmt: fmtVND(r.actualPay),
  }))
```

- [ ] **Step 3: Sửa header bảng**

Xóa cột "Lương tháng" trong `<thead>`. Tìm:
```jsx
                <th className="py-2 pr-3 font-medium text-navy-600">Giáo viên</th>
                <th className="py-2 pr-3 font-medium text-navy-600 text-right">Lương tháng</th>
                <th className="py-2 pr-3 font-medium text-navy-600 text-center">Buổi/lịch</th>
```
Thay bằng (bỏ "Lương tháng", "Đơn giá/buổi" đã có sẵn ở cuối — giữ nguyên cột đó):
```jsx
                <th className="py-2 pr-3 font-medium text-navy-600">Giáo viên</th>
                <th className="py-2 pr-3 font-medium text-navy-600 text-center">Buổi/lịch</th>
```

- [ ] **Step 4: Sửa thân bảng — bỏ ô lương tháng, đổi cảnh báo**

Tìm khối `<td>` của tên + lương tháng:
```jsx
                  <td className="py-1.5 pr-3 text-navy-800 font-medium">
                    {r.name}
                    {r.base === 0 && (
                      <span className="ml-1.5 text-xs text-amber-600">(chưa đặt lương)</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 text-navy-700 text-right">{fmtVND(r.base)}</td>
                  <td className="py-1.5 pr-3 text-navy-700 text-center">{r.scheduled}</td>
```

Thay bằng (cảnh báo dựa trên `r.rate`, bỏ ô `r.base`):
```jsx
                  <td className="py-1.5 pr-3 text-navy-800 font-medium">
                    {r.name}
                    {r.rate === 0 && (
                      <span className="ml-1.5 text-xs text-amber-600">(chưa đặt đơn giá)</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 text-navy-700 text-center">{r.scheduled}</td>
```

> Cột "Đơn giá/buổi" đã có sẵn ở cuối bảng (`<td>...fmtVND(r.rate)...</td>`) — giữ nguyên.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Kiểm thử thủ công**

Run: `npm run dev` → trang Giảng Dạy → tab Bảng Lương. Xác nhận cột "Đơn giá/buổi" hiển thị, không còn "Lương tháng", thực nhận = đơn giá × (đã dạy + dạy thay). Export Excel kiểm tra cột khớp.

- [ ] **Step 7: Commit**

```bash
git add src/components/schedule/PayrollTab.jsx
git commit -m "feat(payroll-tab): hiển thị đơn giá/buổi thay cột lương tháng"
```

---

## Task 11: AdminPanelPage — nhập "Đơn giá/buổi"

**Files:**
- Modify: `src/pages/AdminPanelPage.jsx` (handlers + JSX khoảng dòng 130-154, 293-326)

- [ ] **Step 1: Sửa handler đọc/ghi sessionRate**

Đổi `handleEditSalary` (dòng ~130-133):
```jsx
  const handleEditSalary = (t) => {
    setEditingSalaryId(t.id)
    setSalaryDraft(t.sessionRate != null ? String(t.sessionRate) : '')
  }
```

Đổi `handleSaveSalary` (dòng ~140-154):
```jsx
  const handleSaveSalary = async (t) => {
    const value = salaryDraft === '' ? null : Number(salaryDraft)
    setSavingSalaryId(t.id)
    try {
      await teacherService.update(t.id, { sessionRate: value })
      toast.success('Đã lưu đơn giá/buổi')
      setEditingSalaryId(null)
      setSalaryDraft('')
      loadTeachers()
    } catch (err) {
      toast.error('Lỗi lưu đơn giá: ' + err.message)
    } finally {
      setSavingSalaryId(null)
    }
  }
```

- [ ] **Step 2: Sửa JSX nhãn**

Tại block nhập (dòng ~293-326), đổi `label="Lương tháng"` → `label="Đơn giá/buổi"`. Đổi nhãn hiển thị `<p ...>Lương tháng</p>` → `Đơn giá/buổi`. Đổi `t.monthlySalary` → `t.sessionRate` ở chỗ hiển thị giá trị (dòng ~325):
```jsx
                              {t.sessionRate != null ? fmtVND(t.sessionRate) : <span className="text-navy-400 font-normal">Chưa đặt</span>}
```

> Đọc lại file quanh dòng 293-326 để khớp chính xác chuỗi cần thay (label component `Input` và 2 chỗ chữ "Lương tháng").

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Kiểm thử thủ công**

Run: `npm run dev` → Admin → card giáo viên → nhập đơn giá/buổi → lưu → thấy hiển thị đúng + bảng lương cập nhật.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AdminPanelPage.jsx
git commit -m "feat(admin): nhập đơn giá/buổi cho giáo viên"
```

---

## Task 12: Đồng bộ tài liệu + seed

**Files:**
- Modify: `CLAUDE.md` (mục "Mô hình lương giáo viên")
- Modify: `supabase/seed/seed_mock_data.sql` (nếu có `monthly_salary`)

- [ ] **Step 1: Kiểm tra seed có dùng monthly_salary không**

Run: `grep -n "monthly_salary" supabase/seed/seed_mock_data.sql || echo "không có"`

Nếu có dòng set `monthly_salary` → đổi sang `session_rate` với giá trị hợp lý (vd `monthly_salary = 8000000` → `session_rate = 200000`). Nếu không có → bỏ qua bước này.

- [ ] **Step 2: Cập nhật CLAUDE.md**

Trong mục "Mô hình lương giáo viên" (`migration 20260622000001...`), viết lại để phản ánh per-session:
- `teachers.session_rate` (numeric, nullable): đơn giá mỗi buổi — chỉ admin set (trigger DB bảo vệ).
- Lương thực nhận = `session_rate × (số buổi đã dạy + số buổi dạy thay đã xác nhận)`.
- `scheduled` chỉ để hiển thị tham khảo, không dùng để chia.
- Ghi chú: `monthly_salary` orphan (không drop), thêm migration `20260627000001_add_teacher_session_rate.sql`.

Cập nhật dòng "Service & hook cập nhật": `teacherService.update` nhận `{ name, sessionRate }`; `getAll` trả `sessionRate`.

- [ ] **Step 3: Build (đảm bảo không vô tình sửa code)**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md supabase/seed/seed_mock_data.sql
git commit -m "docs: cập nhật mô hình lương theo buổi + seed"
```

---

## Task 13: Kiểm thử tổng thể + đóng nhánh

- [ ] **Step 1: Build cuối**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 2: Smoke test thủ công toàn luồng**

Run: `npm run dev`
- Phiếu: review có xuống dòng → PDF giữ dòng; buổi vắng + bài chưa làm liệt kê đúng; điểm kỹ năng màu theo mức; footer ký tên.
- Lương: admin set đơn giá → bảng lương đúng; GV thường chỉ thấy của mình.

- [ ] **Step 3: Hoàn tất**

Dùng skill `superpowers:finishing-a-development-branch` để quyết định merge/PR.

---

## Self-Review (đã chạy khi viết plan)

- **Spec coverage:** 1.A→Task1, 1.B→Task2+3+4+5, 1.C(homework)→Task3/4/5, 1.D(UI đẹp)→Task6; 2.A→Task7, 2.B→Task9, 2.C→Task8, 2.D→Task10/11, 2.E→Task12. ReviewsPage (caller single export, không nêu trong spec) → Task4 đã bổ sung.
- **Placeholder scan:** không có TBD/TODO; mọi step có code cụ thể.
- **Type consistency:** prop `attendanceDetail = { pct, present, total, absentDates }` và `homeworkDetail = { pct, done, total, missing:[{date,sessionTopic}] }` dùng nhất quán ở Task 3/4/5. `sessionRate` nhất quán Task 7/8/9/10/11. `r.rate` (đã round) dùng cho cột đơn giá; bỏ `r.base` ở mọi nơi (Task 9 xóa, Task 10 cập nhật caller).
