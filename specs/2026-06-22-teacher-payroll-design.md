# Thiết kế: Lương giáo viên & dạy thay (Teacher Payroll)

**Ngày:** 2026-06-22
**Trang ảnh hưởng:** `SchedulePage` (đổi tên hiển thị thành **"Giảng Dạy"**, route giữ `schedule`)
**Trạng thái:** Đã duyệt thiết kế, chờ viết implementation plan.

## 1. Mục tiêu

Cho phép admin chấm công + tính lương giáo viên dựa trên lịch dạy cố định:

- Mỗi giáo viên có **lương tháng cố định**.
- Lương tháng được chia đều cho **số buổi theo lịch trong tháng** → ra **đơn giá mỗi buổi**.
- Khi giáo viên A vắng một buổi và giáo viên B dạy thay: A **mất** đơn giá buổi đó; B **nhận thêm** một buổi tính theo **đơn giá của chính B**.
- Có **tab Bảng Lương** theo tháng: admin xem toàn bộ giáo viên; giáo viên thường chỉ xem lương của chính mình.

## 2. Công thức (nguồn chân lý)

Với giáo viên `T` trong tháng `M`:

- `base` = `T.monthlySalary` (lương tháng cố định).
- `scheduled` = tổng số lần xuất hiện trong tháng `M` của tất cả ca lịch (`schedule`) thuộc các lớp do `T` phụ trách. Đếm bằng số ngày trong tháng trùng `day_of_week` của từng ca.
- `rate` (đơn giá buổi) = `scheduled > 0 ? base / scheduled : 0`.
- `absent` = số record `teacher_attendance` trong tháng có `teacher_id = T` và `status = 'absent'`.
- `taught` (đã dạy của mình) = `scheduled - absent`.
- `subs` (dạy thay) = số record `teacher_attendance` trong tháng có `substitute_teacher_id = T`.
- **`actualPay` = `rate × (taught + subs)`**.

Ghi chú nhất quán: vì buổi dạy thay trả theo **đơn giá của B** (người dạy thay), nên `taught` và `subs` đều nhân cùng `rate` của `T`. Người vắng A tự động mất phần của mình vì `taught` đã trừ `absent`.

**Đơn giản hóa có chủ đích:** `scheduled` đếm mọi lần xuất hiện ca trong tháng, **không** loại trừ các ngày trước `start_date` hoặc sau khi lớp kết thúc. Đủ dùng cho quy mô hiện tại; nếu cần chính xác hơn sẽ là một change sau.

## 3. Data model & migration

Migration mới: `supabase/migrations/20260622000001_add_teacher_salary_and_substitute.sql`

- `teachers.monthly_salary` — `numeric`, nullable, default `null`. Lương tháng cố định.
- `teacher_attendance.substitute_teacher_id` — `uuid` nullable, FK → `teachers(id)`. Chỉ có giá trị khi `status = 'absent'`.
- **RLS:**
  - Sửa policy SELECT của `teacher_attendance` để giáo viên dạy thay đọc được buổi mình dạy thay:
    `using (teacher_id = auth.uid() or substitute_teacher_id = auth.uid() or is_admin())`.
  - `teachers`: policy SELECT hiện có đã cho giáo viên đọc row của chính mình → `monthly_salary` đọc được, không cần policy mới. Lương chỉ admin ghi (đã có policy admin write trên `teachers`).
- **Đồng bộ seed:** cập nhật `supabase/seed/seed_mock_data.sql` nếu cần (set `monthly_salary` mẫu cho teacher mock + vài record dạy thay để test bảng lương).

## 4. Service layer

- `teacherService.getAll()`: thêm `monthly_salary` vào select; `fromDB` map `monthlySalary`.
- `teacherService.update(id, { name, monthlySalary })`: cho phép admin lưu lương (giữ tương thích chữ ký cũ `{ name }`).
- `teacherAttendanceService`:
  - `fromDB/toDB` map thêm `substituteTeacherId` ⇄ `substitute_teacher_id`.
  - `upsert` nhận thêm `substituteTeacherId` (mặc định `null`).
  - Thêm `getByMonth(year, month)` trả mọi record trong tháng (cho bảng lương).
- **Mới** `src/services/payrollService.js` (hoặc `src/utils/payroll.js`): `buildPayrollRows({ year, month, teachers, classes, schedule, attendance })` → mảng dòng `{ teacherId, name, base, scheduled, taught, absent, subs, rate, actualPay }`. Thuần hàm, tính client-side (giống `feeService.buildFeesRows`).
- `useAuth`: đảm bảo profile teacher nạp kèm `monthly_salary` (cho giáo viên tự xem lương).

## 5. UI

### 5.1 Nhập lương (admin) — `AdminPanelPage`
Mỗi dòng giáo viên trong danh sách thêm ô nhập **"Lương tháng"** (định dạng VNĐ) + nút lưu → `teacherService.update`. Không đặt UI lương ở nơi khác.

### 5.2 Trang "Giảng Dạy" có 2 tab
Đổi tiêu đề `SchedulePage` thành **"Giảng Dạy"** (route giữ `schedule`). Hai tab:
- **Lịch Dạy** — toàn bộ nội dung hiện tại (lưới tuần + chấm công + thanh "Hôm nay" + nút "Xếp Lịch").
- **Bảng Lương** — bảng lương theo tháng (5.4).

Tab hiện với mọi user; nội dung Bảng Lương khác nhau theo quyền (5.5).

### 5.3 UX dạy thay trên `ScheduleCard`
Giữ chip toggle Đã dạy ↔ Vắng. Khi buổi ở trạng thái **Vắng**, ngoài ô ghi chú inline hiện có, hiện thêm:
- **Dropdown "Dạy thay"** liệt kê giáo viên khác (loại trừ giáo viên của lớp). Mục đầu "— Không —".
- Chọn B → `upsert({ ..., status: 'absent', substituteTeacherId: B })`.
- Khi đã có người dạy thay: hiện nhãn nhỏ "Dạy thay: {tên B}".
- Toggle về "Đã dạy" → `substituteTeacherId` đặt về `null`.

Props mới truyền từ `SchedulePage` → `WeeklyGrid` → `ScheduleCard`: danh sách `teachers` và `onSetSubstitute(item, date, teacherId)`.

### 5.4 Tab Bảng Lương
- **Month picker** riêng trong tab (mặc định tháng hiện tại).
- Bảng cột: Giáo viên · Lương tháng · Buổi theo lịch · Đã dạy · Vắng · Dạy thay · Đơn giá/buổi · Thực nhận.
- Giáo viên chưa đặt lương (`base` null/0) → hiện cảnh báo "Chưa đặt lương", `rate` = 0.
- Tiền tệ: `Intl.NumberFormat('vi-VN') + 'đ'`.
- **Export Excel/PDF** (lazy-load `xlsx`/`jspdf` trong handler, try/catch + toast — như các báo cáo khác).
- Empty state khi không có dữ liệu.

### 5.5 Quyền (UI)
- `usePermissions()` thêm cờ `canViewAllPayroll` (= `isAdmin`).
- Admin: bảng tất cả giáo viên.
- Giáo viên thường: bảng lọc còn đúng dòng `teacher.id` của mình (RLS cũng chỉ trả dữ liệu của họ). Ẩn các dòng/cột không liên quan nếu cần.
- Lớp UX không thay RLS — RLS Postgres là nguồn chân lý bảo mật.

## 6. Việc cập nhật tài liệu (bắt buộc theo CLAUDE.md)
Sau khi implement, cập nhật `CLAUDE.md` + `README.md`:
- Mô hình lương giáo viên + công thức.
- Bảng `teacher_attendance` thêm `substitute_teacher_id`; `teachers` thêm `monthly_salary`.
- Trang `schedule` đổi tên hiển thị "Giảng Dạy" + 2 tab; cờ `canViewAllPayroll`.
- Service mới `payrollService`.

## 7. Ngoài phạm vi (YAGNI)
- Lịch sử lương theo tháng (dùng lương cố định hiện tại).
- Phụ phí/thưởng/khấu trừ ngoài công thức buổi.
- Loại trừ ngày trước `start_date`/sau khi lớp kết thúc khi đếm buổi.
- Trạng thái chấm công thứ ba (đã bỏ `makeup`).
- Trả lương dạy thay theo đơn giá của người vắng (đã chốt: theo đơn giá người dạy thay).
