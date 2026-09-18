# Thiết kế: Nhiều giáo viên / 1 lớp + Học phí dạng tick

Ngày: 2026-09-18

Hai thay đổi độc lập, gom trong một spec vì cùng đợt triển khai.

---

## Phần 1 — Học phí: chỉ còn một ô tick

### Vấn đề

Mô hình hiện tại theo dõi **số tiền**: `enrollments.monthly_fee`/`course_fee` đặt mức phí
cho từng học sinh, `payments` ghi từng lần đóng (có `amount`, `paid_at`, `method`), và
trạng thái "đã đóng" được suy ra bằng `tổng đã đóng >= số phải đóng`. Vì vậy mới có
trạng thái "đóng một phần", `fees.surcharge`, `PaymentModal`, và
`StudentPaymentHistoryPanel`.

Thực tế vận hành đơn giản hơn nhiều: mỗi lớp có **một mức học phí cố định theo tháng**,
mọi học sinh trong lớp đóng như nhau, và người quản lý chỉ cần **tick** khi ai đó đã đóng.

### Quyết định

- Học phí là thuộc tính của **lớp**, không phải của từng enrollment.
- Không có mức riêng cho từng học sinh (không giảm giá, không học bổng ở tầng dữ liệu).
- Chu kỳ duy nhất là **theo tháng**. Bỏ kiểu "theo khóa".
- Trạng thái đóng phí là **nhị phân**: đã đóng / chưa đóng. Không còn "đóng một phần".
- Bỏ phụ phí tháng.
- Trang Học phí **đếm người**, không hiển thị tổng tiền. Mức phí của lớp chỉ hiển thị ở
  thông tin lớp.

### Thay đổi dữ liệu

Migration mới `20260918000001_simplify_fees_to_paid_flag.sql`:

- `alter table classes add column monthly_fee integer` — mức học phí cố định của lớp,
  nullable.
- `fees` giữ nguyên cấu trúc (`student_id`, `class_id`, `year`, `month`, `paid`, `note`,
  unique `(student_id, class_id, year, month)`). Cột `surcharge` **ngừng dùng ở app
  layer**, để lại trong DB, không drop.
- `enrollments.fee_type` / `monthly_fee` / `course_fee`: ngừng dùng ở app layer, để lại
  trong DB, không drop.
- `payments`: bảng để lại nguyên vẹn nhưng orphan — không còn UI/service nào ghi vào.
  `src/services/paymentService.js` xóa khỏi repo (không còn nơi import).

Theo tiền lệ của repo (`monthly_salary`, `settings.teacher_name`, `class_materials`), cột
và bảng thôi dùng thì để orphan thay vì drop — giữ dữ liệu lịch sử, rollback rẻ.

### Backfill dữ liệu cũ

Trong cùng migration, với mỗi `(student_id, class_id, year, month)` có enrollment active:

```
số phải đóng (cũ) = fee_type='course' ? course_fee : monthly_fee + coalesce(surcharge,0)
đã đóng (cũ)      = sum(payments.amount) where period = 'YYYY-MM' and class_id khớp
```

Nếu `đã đóng >= số phải đóng` và `số phải đóng > 0` → upsert `fees.paid = true`. Mọi
trường hợp còn lại (kể cả đóng một phần) → `paid = false`.

Đồng thời backfill `classes.monthly_fee` = mức `monthly_fee` phổ biến nhất trong các
enrollment active của lớp (mode); lớp không có enrollment nào → để `null` cho admin nhập
tay.

**Đã xác nhận với người dùng:** các khoản đóng một phần sẽ trở thành "chưa đóng". Lịch sử
số tiền vẫn nằm nguyên trong `payments` nên tra cứu lại được bằng SQL.

### Service

`feeService` rút gọn còn:

- `buildFeesRows(year, month)` — 1 dòng cho mỗi enrollment active, trả
  `{ studentId, studentName, classId, className, monthlyFee, paid }`. Hai truy vấn
  (`enrollments` join students/classes, `fees` của tháng), không còn đọc `payments`.
- `setPaid(studentId, classId, year, month, paid)` — upsert `fees` theo unique key.

Bỏ `calcFee`, `isFeePaid`, `getByStudentMonth`, `upsert` (dạng cũ nhận `surcharge`).

### UI

`src/pages/FeesPage.jsx`:

- Bảng: mỗi dòng là một cặp (học sinh, lớp) với một checkbox "Đã đóng". Tick/bỏ tick ghi
  ngay (optimistic, revert + `toast.error` khi lỗi).
- Tab lọc: Tất cả / Đã đóng / Chưa đóng. Bỏ tab "Đóng một phần".
- Thẻ thống kê đếm **học sinh duy nhất**: "Đã đóng đủ" (mọi lớp của HS đó đều tick),
  "Còn nợ" (còn ít nhất một lớp chưa tick). Bỏ 3 thẻ tiền (Tổng thu / Kỳ vọng / Còn nợ).
- Bộ lọc lớp giữ nguyên.
- Xuất Excel giữ lại; cột = Học sinh / Lớp / Tháng / Trạng thái.

Xóa `src/components/fees/PaymentModal.jsx` và
`src/components/fees/StudentPaymentHistoryPanel.jsx`.

`ClassModal`: thêm ô "Học phí / tháng" (chỉ admin), định dạng
`Intl.NumberFormat('vi-VN')`. Hiển thị mức phí trên thẻ lớp ở `ClassesOverviewPage` và
header `ClassDetailPage`.

`EnrollmentModal` / `BulkFeeModal` / `BulkFeeFields` / `BulkEnrollPickerModal`: bỏ phần
nhập học phí (toggle "Theo tháng / Theo khóa", ô số tiền). Ghi danh chỉ còn chọn học sinh
+ trạng thái + mục tiêu + ghi chú. `BulkFeeModal` không còn lý do tồn tại → gộp việc chọn
học sinh thẳng vào luồng ghi danh hàng loạt, xóa `BulkFeeModal.jsx` và
`BulkFeeFields.jsx`.

`DashboardPage` (thẻ "Chưa đóng phí") và `AdminPanelPage` (thẻ "HS chưa đóng phí"): đếm
học sinh duy nhất có ít nhất một dòng `paid = false` trong tháng hiện tại, qua
`buildFeesRows`.

`ReportsPage` — card Học phí: biểu đồ chuyển từ tiền sang **số học sinh đã đóng / chưa
đóng theo tháng**. Drill-down hiện danh sách học sinh chưa đóng thay vì danh sách thanh
toán.

---

## Phần 2 — Nhiều giáo viên / 1 lớp, chia theo ca

### Vấn đề

`classes.teacher_id` hiện gánh hai vai trò: "GV phụ trách lớp" và **khóa phân quyền** —
RLS của `attendance`, `homeworks`, `submissions`, `mock_test_results` đều join về nó
(migration `20260710000001`), lịch dạy và bảng lương cũng suy ra từ nó. Một lớp vì vậy chỉ
có đúng một giáo viên.

Thực tế: một lớp có thể chia buổi giữa nhiều giáo viên (T2 cô A, T4 cô B). Mỗi buổi thuộc
về **một** giáo viên cụ thể — không phải dạy chung.

### Quyết định

Hướng đã chọn: **gắn giáo viên vào từng ca trong `schedule`**, không thêm bảng nối.

- `classes.teacher_id` giữ nguyên nghĩa: GV phụ trách chính / chủ sở hữu lớp.
- `schedule.teacher_id` (nullable): ai dạy ca đó. `null` = GV phụ trách lớp.
- Quyền truy cập lớp mở rộng: là GV phụ trách **hoặc** có ít nhất một ca trong lớp.

Phương án bảng nối `class_teachers` bị loại vì tách "ai có quyền" khỏi "ai dạy ca nào" tạo
ra hai nguồn sự thật phải giữ đồng bộ — thêm GV vào ca mà quên thêm vào lớp thì họ mất
quyền. Phương án "chỉ chia lương, không chia quyền" bị loại vì GV phụ sẽ không điểm danh
được lớp mình dạy.

### Thay đổi dữ liệu

Migration mới `20260918000002_multi_teacher_per_class.sql`, gom trọn bộ để rollback được bằng
một lần drop/re-create:

- `alter table schedule add column teacher_id uuid references teachers(id) on delete set null`
- Hàm helper:

```sql
create or replace function public.can_access_class(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or exists (select 1 from classes c
                  where c.id = cid and c.teacher_id = auth.uid())
      or exists (select 1 from schedule s
                  where s.class_id = cid and s.teacher_id = auth.uid());
$$;
```

- Thay điều kiện `classes.teacher_id = auth.uid()` bằng `can_access_class(<class_id>)`
  trong policy của: `classes` (SELECT), `sessions`, `enrollments`, `attendance`,
  `homeworks`, `submissions`, `mock_test_results`, `reviews`, `session_reviews`,
  `general_comments`, và policy "đọc học sinh trong lớp mình" của `students`
  (`20260625000002`).
- `schedule`: SELECT cho GV phụ trách lớp hoặc `teacher_id = auth.uid()`; INSERT/UPDATE/
  DELETE chỉ admin (lịch được sinh tự động từ `ClassModal`, vốn đã là màn hình admin).
- `teacher_attendance`: policy "GV tự chấm công lớp mình" (`20260625000001`) đổi sang kiểm tra
  `schedule.teacher_id = auth.uid()` (fallback `classes.teacher_id` khi `teacher_id` null)
  thay vì chỉ `classes.teacher_id`.

Không cần backfill: `teacher_id = null` mang đúng nghĩa cũ.

Rollback = drop các policy mới + `can_access_class`, re-create bản cũ (nội dung gốc ở
`20260710000001` và `20260625000002`), rồi `alter table schedule drop column teacher_id`.

### Lương

`src/utils/payroll.js` — sửa đúng một chỗ:

```js
const scheduleTeacher = new Map(
  schedule.map(s => [s.id, s.teacherId ?? classTeacher.get(s.classId) ?? null])
)
```

`scheduled` của mỗi GV từ đó chỉ đếm ca của chính họ. `taught` / `absent` / `subs` vốn đã
keyed theo `teacher_attendance.teacher_id` nên không đổi. Luồng dạy thay giữ nguyên.

`scheduleService.getAll` / `getByDay` / `fromDB` / `toDB` map thêm `teacherId`.

### UI

`ClassModal` (chỉ admin): dưới nhóm nút T2…CN, mỗi thứ **đang được chọn** hiện thêm một
`Select` giáo viên, mặc định "GV phụ trách". State `teacherByDay: { [dayOfWeek]: teacherId | '' }`.

`scheduleService.syncForClass(classId, { dayList, startTime, endTime, room, teacherByDay })`:
ghi `teacher_id` cho từng ca theo `teacherByDay`; khi `teacherByDay` là `undefined` thì
giữ nguyên `teacher_id` của ca cũ (cùng cách hàm này đang giữ `note`), để các luồng chỉ
sửa giờ/phòng không xóa mất việc gán GV.

**Cảnh báo mất quyền:** khi admin bỏ chọn một thứ, ca đó bị xóa. Nếu GV được gán cho ca đó
không còn ca nào khác trong lớp và cũng không phải GV phụ trách, `ClassModal` hiện xác
nhận trước khi lưu: "Bỏ thứ này sẽ khiến {tên GV} không còn truy cập được lớp. Tiếp tục?"

`ScheduleCard`: khi lớp có từ 2 GV trở lên, hiện thêm dòng tên GV phụ trách ca đó (dòng
riêng, không đặt cạnh badge — theo quy ước "thông tin không được thua cuộc tranh chỗ").
Lớp một GV không hiện gì thêm, tránh nhiễu.

`ClassDetailPage` header: liệt kê các GV tham gia kèm thứ phụ trách
(`fmtDayList` sẵn có trong `src/utils/helpers.js`).

`usePermissions` **không đổi** — đây là quyền theo dữ liệu (RLS), không phải theo vai trò.

---

## Kiểm chứng

Repo không có test runner. Kiểm chứng bằng tay theo danh sách sau, chạy với hai tài khoản
(một admin, một GV thường):

**Học phí**
1. Đặt học phí cho lớp trong `ClassModal` → mức phí hiện ở thẻ lớp.
2. Trang Học phí: tick một học sinh → đổi trạng thái ngay, reload vẫn giữ.
3. Học sinh học 2 lớp → 2 dòng độc lập; tick 1 lớp thì thẻ "Còn nợ" vẫn đếm học sinh đó.
4. Đổi tháng → trạng thái tick theo đúng tháng.
5. GV thường không thấy mục "Học phí" trong Navbar.

**Nhiều GV**
6. Admin gán cô B cho thứ Tư của lớp của cô A.
7. Đăng nhập cô B: thấy lớp trong danh sách, mở được ClassDetail, **điểm danh ghi được**
   (đây là chỗ RLS dễ vỡ nhất — `new row violates row-level security policy`).
8. Cô B thấy ca thứ Tư trên lịch dạy và tick "đã dạy" được; không tick được ca thứ Hai.
9. Bảng lương tháng: `scheduled` của cô A không còn tính thứ Tư; của cô B đếm đúng số thứ
   Tư trong tháng.
10. Bỏ chọn thứ Tư trong `ClassModal` → hiện cảnh báo mất quyền; sau khi lưu, cô B không
    còn thấy lớp.

## Việc phải làm kèm

- Cập nhật `supabase/seed/seed_mock_data.sql`: thêm `classes.monthly_fee`,
  `schedule.teacher_id`, chuyển dữ liệu học phí mẫu sang `fees.paid`, bỏ insert
  `payments`.
- Cập nhật `CLAUDE.md` (mục "Model học phí", "Quyết định kiến trúc đã chốt", "Mô hình lương
  giáo viên", danh sách services) và `README.md`.
