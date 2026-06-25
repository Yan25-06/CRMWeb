# Quản lý giáo viên, chấm công opt-in & dạy thay xác nhận

**Ngày:** 2026-06-25
**Trạng thái:** Đã duyệt design — chờ review spec

## Bối cảnh & mục tiêu

Trang Admin và phần Giảng Dạy hiện tại đã có: danh sách giáo viên + lương, lưới lịch dạy, chấm công 2 trạng thái (mặc định "Đã dạy"), dạy thay (admin gán), bảng lương (admin xem tất cả / GV xem mình).

Cần thay đổi để phản ánh đúng quy trình thực tế của trung tâm:

1. **Admin Panel** — hiển thị lịch dạy của từng lớp ngay trong card giáo viên (inline expand).
2. **Chấm công opt-in** — bỏ mặc định "Đã dạy". **Giáo viên tự chấm công**: phải bấm xác nhận "Đã dạy" thì buổi đó mới tính lương. Không bấm = "Chưa xác nhận" = không tính.
3. **Dạy thay có xác nhận** — admin gán người dạy thay; **giáo viên dạy thay tự bấm "Xác nhận đã dạy"** thì buổi đó mới tính vào lương của họ.
4. **Bảng lương** — giữ phân quyền hiện tại (admin xem hết, GV xem mình), chỉ đổi công thức theo mô hình opt-in.

### Quyết định đã chốt khi brainstorm
- Mô hình chấm công: **Opt-in** (phương án B) — không có record = chưa xác nhận, không tính lương.
- Người chấm công: **giáo viên tự chấm** cho lớp của mình.
- Dạy thay: **Admin gán → GV dạy thay xác nhận** (phương án B) — admin kiểm soát ai dạy thay, GV dạy thay chủ động xác nhận.
- Admin Panel: **Inline expand** (phương án A) — bấm card GV để xem lớp + lịch.

---

## ① Admin Panel — Inline expand lịch dạy theo giáo viên

**File:** `src/pages/AdminPanelPage.jsx`

Mỗi card giáo viên (cột trái) thêm khả năng **expand/collapse**. Khi expand, hiện danh sách lớp phụ trách kèm lịch học tóm tắt.

- Thêm state `expandedTeacherId` (chỉ 1 GV expand tại một thời điểm, hoặc dùng Set nếu muốn nhiều — chọn 1 cho gọn).
- Header card vẫn giữ chức năng lọc lớp ở cột phải (click để filter). Thêm icon chevron ▼/▲ để toggle expand. **Phân biệt 2 hành vi click:** một vùng/nút riêng cho expand, tránh xung đột với hành vi lọc hiện có. Đề xuất: nút chevron riêng ở góc phải toggle expand; click vùng tên vẫn lọc như cũ.
- Khi expand, render danh sách lớp của GV đó (lọc từ `classes` theo `teacherId`), mỗi dòng hiển thị:
  - Tên lớp
  - Lịch tóm tắt: các thứ + giờ + phòng. Dùng `class.scheduleDayList`, `class.startTime`, `class.endTime`, `class.room` (đã có sẵn từ `classService.fromDB`). Format thứ qua helper `0=CN…6=T7` → "T2, T4, T6".
  - Badge loại khóa (IELTS / TOEIC / GT) — tái dùng màu từ `COURSE_COLORS` nếu phù hợp, hoặc badge đơn giản.
- Không cần thêm service mới — `classes` đã load sẵn trong trang. Cần đảm bảo `classService.getAll()` trả `scheduleDayList/startTime/endTime/room` (đã có).

**Không thay đổi:** logic lương, nút cấp/thu hồi admin, tạo/đổi lớp.

---

## ② Chấm công opt-in — 3 trạng thái

### Mô hình trạng thái

| Trạng thái | Record DB | Ý nghĩa | Tính lương? |
|-----------|-----------|---------|-------------|
| Chưa xác nhận | Không có record (hoặc status khác present/absent) | Mặc định ban đầu | ❌ Không |
| Đã dạy | `status = 'present'` | GV xác nhận đã dạy | ✅ Có |
| Vắng | `status = 'absent'` | GV/admin đánh dấu vắng | ❌ Không |

**Chip toggle 3 trạng thái (vòng lặp):** Chưa xác nhận → (bấm) Đã dạy → (bấm) Vắng → (bấm) Chưa xác nhận.

- "Chưa xác nhận" = **xóa record** (`teacherAttendanceService.remove(scheduleId, date)`), không lưu status rỗng → giữ DB sạch và đồng nhất với "không có record".
- "Đã dạy" = upsert `status='present'`.
- "Vắng" = upsert `status='absent'`.

### Thay đổi UI

**File:** `src/components/schedule/attendanceStatus.js`
- Thêm trạng thái hiển thị "pending" (Chưa xác nhận): màu xám (`bg-slate-100`, `text-slate-500`, `border-slate-300`, `dot bg-slate-400`). Đây là trạng thái **hiển thị** khi không có record — không lưu vào DB.

**File:** `src/components/schedule/ScheduleCard.jsx`
- `isAbsent` logic giữ nguyên; thêm nhận biết "không có record" → render chip xám "Chưa xác nhận" thay vì mặc định "Đã dạy" (xanh) như hiện tại.
- `onToggleAttendance` đổi từ toggle 2 trạng thái → cycle 3 trạng thái. Tính `nextStatus` ở `SchedulePage` (xem dưới).

**File:** `src/components/schedule/WeeklyGrid.jsx` — không đổi cấu trúc, chỉ truyền props như cũ.

**File:** `src/pages/SchedulePage.jsx`
- `handleToggleAttendance(item, date)` đổi logic cycle:
  - record hiện tại `present` → next `absent` (upsert).
  - record hiện tại `absent` → **xóa record** (về "chưa xác nhận").
  - không có record → next `present` (upsert).
- `loadAttendance` hiện chỉ chạy khi `canCheckTeacherAttendance` (admin). **Phải chạy cho cả giáo viên thường** để họ thấy/chấm công lớp mình. Đổi điều kiện sang `canCheckOwnAttendance` (xem ④ phân quyền).
- Ghi chú "Vắng" (`onAttendanceNote`) và dropdown dạy thay giữ nguyên cho admin.

### Ai thấy chip chấm công?
- **Admin:** thấy chip trên mọi card (như hiện tại).
- **Giáo viên thường:** thấy chip trên card **lớp của chính mình** và tự bấm. (Lưới của GV thường chỉ chứa lớp của họ do RLS, nên thực tế mọi card đều của họ.)

---

## ③ Dạy thay — admin gán, GV dạy thay xác nhận

### Mô hình dữ liệu
Thêm cột `teacher_attendance.substitute_confirmed boolean not null default false`.

- Admin gán người dạy thay (như hiện tại) → set `substitute_teacher_id`, `substitute_confirmed` mặc định `false`.
- GV dạy thay bấm "Xác nhận đã dạy" → set `substitute_confirmed = true`.
- Chỉ khi `substitute_confirmed = true` thì buổi đó mới tính vào lương người dạy thay.

### Vấn đề hiển thị & giải pháp
GV dạy thay **không thấy lớp họ dạy thay trên lưới lịch của mình** — vì lưới chỉ chứa lớp của chính họ (RLS `classes` trả lớp của teacher), còn buổi dạy thay thuộc lớp của **người khác**.

**Giải pháp:** thêm một **section riêng "Buổi được giao dạy thay"** trên trang Giảng Dạy (tab Lịch Dạy), phía trên hoặc dưới lưới, chỉ hiện khi GV hiện tại có ít nhất 1 buổi được giao dạy thay trong tuần đang xem. Mỗi mục là một card vàng:
- Badge "DẠY THAY", tên lớp, giờ, phòng, "Thay cho {tên GV chính}".
- Nút "✓ Xác nhận đã dạy" (khi `substitute_confirmed=false`) → set `true`.
- Khi đã xác nhận: hiển thị "Đã dạy thay ✓ · Đã tính vào lương tháng này", không còn nút.

**Service:** thêm method lấy các buổi dạy thay của GV hiện tại kèm thông tin lớp/lịch/GV chính. Vì cần join, đề xuất:
- `teacherAttendanceService.getSubstituteAssignments(dateFrom, dateTo)` — query `teacher_attendance` where `substitute_teacher_id = auth.uid()` AND `status='absent'` trong khoảng tuần, kèm select join `schedule(*, class:classes(name, room, ...))` và tên GV chính. RLS SELECT đã cho phép substitute đọc record (policy hiện có `substitute_teacher_id = auth.uid()`). Nếu join classes bị RLS chặn (GV thường không SELECT được lớp người khác), cân nhắc:
  - **Phương án ưu tiên:** nới RLS `classes` SELECT để cho phép đọc lớp khi mình là substitute của một buổi thuộc lớp đó; HOẶC
  - **Phương án đơn giản hơn:** denormalize — khi admin gán dạy thay, lưu kèm snapshot tên lớp/giờ vào record (cột phụ). *Quyết định trong giai đoạn implement sau khi kiểm chứng RLS join thực tế.*
- Thêm method `confirmSubstitute(scheduleId, date)` hoặc tái dùng `upsert` với chỉ field `substitute_confirmed`. Lưu ý `upsert` hiện ghi đè toàn bộ record — cần thêm method `update` giữ nguyên các field khác (set riêng `substitute_confirmed`), tránh ghi đè `note`/`status`.

### Service mapping
`teacherAttendanceService.fromDB/toDB` thêm `substituteConfirmed`.

---

## ④ Bảng lương — đổi công thức theo opt-in

**File:** `src/utils/payroll.js` (hàm thuần `buildPayrollRows`)

Công thức mới:

| Đại lượng | Cũ | Mới |
|-----------|-----|-----|
| `scheduled` | số buổi theo lịch trong tháng | **giữ nguyên** (mẫu số đơn giá) |
| `taught` | `scheduled − absent` | **`COUNT(record.status='present' AND teacher_id=t.id)`** |
| `absent` | `COUNT(status='absent')` | giữ nguyên (chỉ để hiển thị) |
| `subs` | `COUNT(substitute_teacher_id=t.id AND status='absent')` | **`COUNT(substitute_teacher_id=t.id AND substitute_confirmed=true)`** |
| `rate` | `base / scheduled` | **giữ nguyên** |
| `actualPay` | `rate × (taught + subs)` | **giữ nguyên công thức**, nhưng `taught`/`subs` theo định nghĩa mới |

Hệ quả: GV không xác nhận buổi nào → `taught=0` → lương buổi = 0 (đúng ý đồ opt-in). Đơn giá vẫn `base/scheduled` để mỗi buổi xác nhận = `lương tháng / số buổi theo lịch`.

**UI `PayrollTab.jsx`:** giữ nguyên cột & phân quyền. Tùy chọn: thêm cột "Chưa xác nhận" (= `scheduled − taught − absent`) để admin biết GV còn buổi chưa chấm. *Đề xuất thêm để minh bạch; xác nhận khi review.*

**Phân quyền:** không đổi — `isAdmin ? tất cả GV : chính mình`.

---

## ⑤ Database & RLS

**Migration mới:** `supabase/migrations/<timestamp>_teacher_attendance_optin_substitute_confirm.sql`

### Schema
```sql
alter table public.teacher_attendance
  add column if not exists substitute_confirmed boolean not null default false;
```

### RLS — cho phép giáo viên tự chấm công lớp của mình
Hiện tại `teacher_attendance` chỉ admin được ghi. Thêm policy cho giáo viên:

```sql
-- Teacher tự chấm công cho buổi thuộc lớp mình phụ trách.
create policy "teacher_attendance: teacher self insert"
  on public.teacher_attendance for insert
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1 from public.schedule s
      join public.classes c on c.id = s.class_id
      where s.id = schedule_id and c.teacher_id = auth.uid()
    )
  );

create policy "teacher_attendance: teacher self update"
  on public.teacher_attendance for update
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "teacher_attendance: teacher self delete"
  on public.teacher_attendance for delete
  using (teacher_id = auth.uid());
```

### RLS — cho phép GV dạy thay xác nhận
```sql
-- GV dạy thay cập nhật record được giao (chỉ giữ vai trò substitute của chính mình).
create policy "teacher_attendance: substitute confirm update"
  on public.teacher_attendance for update
  using (substitute_teacher_id = auth.uid())
  with check (substitute_teacher_id = auth.uid());
```

**Lưu ý bảo mật:** policy substitute update theo dòng (không theo cột) → về lý thuyết GV dạy thay có thể đổi field khác của record. Rủi ro thấp (chỉ record buổi mình được giao). Nếu cần chặt chẽ, thêm trigger giới hạn substitute chỉ được đổi `substitute_confirmed`. *Đánh giá khi implement; mặc định chấp nhận rủi ro thấp theo triết lý dự án.*

**Policy admin** giữ nguyên (admin full write đã có). Policy SELECT giữ nguyên (đã cho teacher + substitute + admin đọc).

### Rollback
```sql
drop policy if exists "teacher_attendance: teacher self insert" on public.teacher_attendance;
drop policy if exists "teacher_attendance: teacher self update" on public.teacher_attendance;
drop policy if exists "teacher_attendance: teacher self delete" on public.teacher_attendance;
drop policy if exists "teacher_attendance: substitute confirm update" on public.teacher_attendance;
alter table public.teacher_attendance drop column if exists substitute_confirmed;
```

### Đồng bộ seed
Cập nhật `supabase/seed/seed_mock_data.sql` nếu có insert `teacher_attendance` để khớp cột mới + mô hình opt-in (một số buổi `present`, một số dạy thay `substitute_confirmed=true`).

---

## ⑥ Phân quyền (usePermissions)

**File:** `src/hooks/usePermissions.js`

- `canCheckTeacherAttendance` hiện = `isAdmin`. Tách thành 2 ngữ nghĩa:
  - `canCheckAllAttendance: isAdmin` — admin chấm/sửa mọi GV, gán dạy thay.
  - `canCheckOwnAttendance: true` — mọi giáo viên tự chấm lớp của mình + xác nhận dạy thay.
- `canViewAllPayroll: isAdmin` — giữ nguyên.

`SchedulePage` dùng `canCheckOwnAttendance` để bật `loadAttendance` + hiển thị chip/section dạy thay cho GV thường; dùng `canCheckAllAttendance` cho các thao tác admin (dropdown gán dạy thay, ghi chú vắng cho GV khác).

---

## Tóm tắt file thay đổi

| File | Thay đổi |
|------|----------|
| `supabase/migrations/<new>.sql` | + `substitute_confirmed`, + RLS teacher self-check & substitute confirm |
| `supabase/seed/seed_mock_data.sql` | Đồng bộ cột + mô hình opt-in |
| `src/services/teacherAttendanceService.js` | Map `substituteConfirmed`; method `getSubstituteAssignments`, `confirmSubstitute`/`update` không ghi đè |
| `src/utils/payroll.js` | `taught = count(present)`, `subs = count(confirmed)` |
| `src/hooks/usePermissions.js` | Tách `canCheckAllAttendance` / `canCheckOwnAttendance` |
| `src/components/schedule/attendanceStatus.js` | + trạng thái hiển thị "pending" (xám) |
| `src/components/schedule/ScheduleCard.jsx` | Chip 3 trạng thái; mặc định "Chưa xác nhận" |
| `src/components/schedule/WeeklyGrid.jsx` | Truyền props (ít/không đổi) |
| `src/pages/SchedulePage.jsx` | Cycle 3 trạng thái; load attendance cho GV; section "Buổi được giao dạy thay" |
| `src/components/schedule/PayrollTab.jsx` | (Tùy chọn) cột "Chưa xác nhận" |
| `src/pages/AdminPanelPage.jsx` | Inline expand lịch dạy theo GV |
| `CLAUDE.md` + `README.md` | Cập nhật mô hình chấm công opt-in, dạy thay xác nhận, RLS mới |

## Ngoài phạm vi (YAGNI)
- Bảng "claim ca" / GV tự nhận ca trống (phương án A đã loại).
- Notification/nhắc nhở khi GV quên chấm công.
- Lịch sử chấm công chi tiết / audit log.
- Drawer chi tiết GV riêng (phương án B của câu hỏi 4 đã loại).
