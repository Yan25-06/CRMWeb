# Thiết kế: Phiếu phụ huynh đẹp hơn + Lương giáo viên theo buổi

**Ngày:** 2026-06-27
**Phạm vi:** 2 tính năng độc lập trong cùng một change.

---

## Phần 1 — Phiếu phụ huynh (Report Card) đẹp & chi tiết hơn

### Bối cảnh
Phiếu hiện tại render qua `ReportCardContent` (trong `src/components/reviews/ReportCardModal.jsx`), dùng chung bởi:
- `ReportCardModal` — xem trước + xuất PNG/PDF cho 1 học viên.
- `BulkExportModal` — xuất PNG hàng loạt thành zip.

Dữ liệu chuyên cần đến từ `attendanceService.getRateByRange`; bài tập từ `homeworkService.getByRange`.

### Vấn đề cần giải quyết
1. **Bug xuống dòng:** giáo viên gõ nhận xét có xuống dòng, nhưng phiếu hiển thị dính liền. Nguyên nhân: `remark`, `advice`, `generalComment` render trong `<p>` thường → HTML thu gọn whitespace/newline.
2. **Chuyên cần & bài tập quá sơ sài:** chỉ hiện `%`. Học sinh/phụ huynh không biết đã vắng buổi nào, chưa làm bài buổi nào.
3. **Giao diện chưa "đẹp như tài liệu chính thức".**

### Giải pháp

#### 1.A — Sửa bug xuống dòng
Thêm class `whitespace-pre-wrap` cho 3 khối text:
- `latestReview.remark` (Ghi Chú)
- `latestReview.advice` (Lời Khuyên)
- `generalComment.text` (Nhận Xét Tổng Kết)

Giữ tông navy, chỉ thêm class. Không đổi cấu trúc dữ liệu.

#### 1.B — Chi tiết chuyên cần (liệt kê ngày vắng)
Sửa `attendanceService.getRateByRange(studentId, classId, fromDate, toDate)`:
- Query `sessions` lấy thêm `date` (hiện chỉ lấy `id`).
- Join attendance `present === false` với `date` của session tương ứng.
- Trả về shape mở rộng (backward-compatible — chỉ thêm field):
  ```
  { present, total, pct, absentDates: ['2026-06-05', '2026-06-12'] }
  ```
- `absentDates` sắp xếp tăng dần theo ngày.

Mọi nơi đang dùng `attRate?.pct` vẫn hoạt động (không breaking).

#### 1.C — Chi tiết bài tập (liệt kê buổi chưa hoàn thành)
`homeworkService.getByRange` **đã trả sẵn** `date` + `sessionTopic` cho mỗi record. Không cần đổi service.

Trong `BulkExportModal.loadStudentData` (và đường dữ liệu của `ReportCardModal`), tính thêm:
- `homeworkPct` (giữ nguyên).
- `homeworkMissing`: mảng các record có `progress` KHÁC `'done'`/`100` → `[{ date, sessionTopic }]`, sắp xếp theo ngày tăng dần.

> Quyết định: "chưa hoàn thành" = mọi trạng thái không phải done (gồm `in_progress` và `not_done`). Hiển thị buổi đang làm dở + chưa làm để phụ huynh thấy đầy đủ.

#### 1.D — Cập nhật `ReportCardContent` (UI phiếu)
Props mới truyền vào (qua cả `ReportCardModal` và `BulkExportModal`):
- `attendanceDetail` = `{ present, total, absentDates }` (hoặc giữ truyền nguyên object từ `getRateByRange`).
- `homeworkDetail` = `{ done, total, missing: [{date, sessionTopic}] }`.

Hiển thị 2 card "Chuyên cần" / "Bài tập":
- Dòng lớn: `75%`
- Dòng phụ nhỏ: `6/8 buổi`
- Danh sách (nếu có):
  - Chuyên cần → *"Vắng: 5/6, 12/6"*
  - Bài tập → *"Chưa hoàn thành: 10/6 (Unit 3), 17/6"*
- Nếu không vắng buổi nào / làm đủ bài → không hiện danh sách (hoặc hiện "Đi học đầy đủ" / "Hoàn thành tất cả" — tùy, mặc định: ẩn danh sách khi rỗng).

Làm đẹp tổng thể (giữ tông navy hiện tại):
- Khung viền ngoài rõ ràng, bo góc (đã có `border-2 border-navy-200`).
- Phần **Điểm Kỹ Năng**: tách label & điểm sang dòng riêng phía trên thanh progress; thanh dày hơn (`h-2.5`); màu theo mức %: ≥80% xanh (`emerald`), 50–79% navy, <50% amber.
- Footer: thêm 2 ô ký tên cạnh nhau — "Giáo viên" và "Phụ huynh" (đường kẻ ký).

Định dạng ngày: helper ngắn `d/M` (đã có `fmtDate` trong file — tái dùng/rút gọn).

### Files chạm tới (Phần 1)
- `src/services/attendanceService.js` — mở rộng `getRateByRange`.
- `src/components/reviews/ReportCardModal.jsx` — `ReportCardContent` + truyền props.
- `src/components/reviews/BulkExportModal.jsx` — tính `homeworkMissing`, truyền props.
- `src/components/reviews/AttendancePanel.jsx` — nếu dùng cùng đường data, kiểm tra không vỡ (chỉ đọc `pct`).

---

## Phần 2 — Lương giáo viên tính theo buổi (per-session)

### Bối cảnh
Model hiện tại (migration `20260622000001`):
- `teachers.monthly_salary` = lương tháng cố định.
- `payroll.js`: `rate = monthly_salary / scheduled`; `actualPay = rate × (taught + subs)`.

### Thay đổi mong muốn
Lương tính **trực tiếp theo đơn giá/buổi**, admin nhập số tiền mỗi buổi. Bỏ phụ thuộc lương tháng.

### Giải pháp

#### 2.A — Data model (migration mới)
File: `supabase/migrations/20260627000001_add_teacher_session_rate.sql`
- `alter table teachers add column if not exists session_rate numeric;`
- Trigger bảo vệ: chỉ admin được đổi `session_rate` (mở rộng/đổi `prevent_salary_change` để cũng kiểm `session_rate`, hoặc thêm điều kiện trong cùng function).
- `monthly_salary` giữ orphan (không drop — theo pattern dự án, tránh rủi ro). Service ngừng đọc/ghi.
- Có khối Rollback trong comment.

#### 2.B — Logic tính lương (`src/utils/payroll.js`)
- Đổi input teachers: dùng `sessionRate` thay `monthlySalary`.
- Công thức mới:
  - `rate = sessionRate ?? 0`
  - `actualPay = rate × (taught + subs)`
- Giữ `scheduled` (số buổi theo lịch) chỉ để **hiển thị tham khảo**, không dùng để chia.
- Bỏ `base` (lương tháng) khỏi row trả về, hoặc đổi tên ngữ nghĩa. Quyết định: bỏ `base`, thêm `rate` = `sessionRate`.
- Cập nhật comment header công thức.
- **Dạy thay:** công buổi dạy thay tính theo `sessionRate` của *người dạy thay* (đã đúng theo logic hiện tại — subs cộng vào `taught + subs` của chính người dạy thay với rate của họ).

#### 2.C — Service (`src/services/classService.js` — phần teacherService)
- `getAll`: select `session_rate` thay `monthly_salary`; trả field `sessionRate`.
- `update(id, { name, sessionRate })`: ghi `session_rate`.

#### 2.D — UI
- `src/components/schedule/PayrollTab.jsx`:
  - Cột "Lương tháng" → "Đơn giá/buổi" (đọc `r.rate`).
  - Bỏ logic chia; cảnh báo "(chưa đặt lương)" → "(chưa đặt đơn giá)" khi `rate === 0`.
  - Excel columns đổi tương ứng.
  - `selfTeacher` đọc `teacher.session_rate` thay `teacher.monthly_salary`.
- `src/pages/AdminPanelPage.jsx`: ô nhập "Lương tháng" → "Đơn giá/buổi"; gọi `teacherService.update({ sessionRate })`.

#### 2.E — Đồng bộ tài liệu
- `CLAUDE.md` mục "Mô hình lương giáo viên": viết lại công thức theo per-session.
- `supabase/seed/seed_mock_data.sql`: nếu seed `monthly_salary` → đổi sang `session_rate`.

### Files chạm tới (Phần 2)
- `supabase/migrations/20260627000001_add_teacher_session_rate.sql` (mới)
- `src/utils/payroll.js`
- `src/services/classService.js`
- `src/components/schedule/PayrollTab.jsx`
- `src/pages/AdminPanelPage.jsx`
- `CLAUDE.md`, `supabase/seed/seed_mock_data.sql`

---

## Ngoài phạm vi (YAGNI)
- Không hỗ trợ song song 2 kiểu lương (tháng + buổi). Chỉ per-session.
- Không thêm lịch sử thay đổi đơn giá.
- Không đổi cách điểm danh/dạy thay đang chạy.
- Không thêm export PDF mới cho bảng lương (giữ Excel hiện có).

## Kiểm thử
- Không có test runner trong dự án → kiểm thử thủ công:
  - Phiếu: tạo review có xuống dòng → xuất PNG/PDF thấy đúng dòng; học sinh có buổi vắng + bài chưa làm → phiếu liệt kê đúng ngày.
  - Lương: admin đặt đơn giá → bảng lương = đơn giá × (đã dạy + dạy thay đã xác nhận); GV thường chỉ xem của mình; GV không sửa được đơn giá (trigger chặn).
