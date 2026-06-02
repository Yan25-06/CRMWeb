## Why

Schema (#1) và RLS (#3) đã sẵn sàng, nhưng UI vẫn đọc/ghi `src/store/db.js` (localStorage). Cần bắt đầu service layer ở nhóm entity gốc — `students`, `classes`, `enrollments` — vì mọi nhóm service sau (#5–#9) đều suy quyền qua `class_id`/`student_id`, nên đây phải là bước chuyển đầu tiên.

## What Changes

- Thêm `src/services/` với client wrapper async cho ba entity: `studentService`, `classService`, `enrollmentService` (đọc/ghi qua `supabase.from(...)`, trả Promise).
- Khi tạo `students`/`classes`, service gán `teacher_id = auth.uid()` để khớp policy ghi của RLS; không filter `teacher_id` khi đọc (RLS đã enforce).
- Chuyển các component tiêu thụ ba entity này sang gọi service async (load trong `useEffect` + state, thay vì đọc đồng bộ): `ClassesOverviewPage`, `ClassDetailPage`, `StudentsTab`, `StudentDetailPanel`, `EnrollmentModal`, phần học sinh/lớp của `DashboardPage`.
- Gỡ các import `students`/`classes`/`enrollments` từ `db.js` ở các component đã chuyển; **không** xóa `db.js` (cutover ở #9).

Phạm vi change này **chỉ** ba entity gốc. KHÔNG gồm: sessions/attendance (#5), homework (#6), fees/reviews/mock-test, banner offline toàn cục, xóa `db.js`.

## Capabilities

### New Capabilities
- `backend-data`: Service layer cô lập Supabase khỏi UI cho ba entity gốc `students`, `classes`, `enrollments` — thao tác đọc/ghi async trả Promise, gán `teacher_id` khi tạo, UI không gọi `supabase.*` trực tiếp.

### Modified Capabilities
<!-- Không có thay đổi requirement của capability đã tồn tại. -->

## Impact

- **Code mới**: `src/services/supabaseClient` re-export (nếu cần), `src/services/studentService.js`, `classService.js`, `enrollmentService.js`.
- **Code sửa**: các component nêu trên chuyển từ đọc đồng bộ `db.js` sang gọi service async + trạng thái loading/error.
- **Phụ thuộc**: cần #1 (schema bảng + cột `teacher_id`) và #3 (RLS policy cho `students`/`classes`/`enrollments`). Là tiền đề cho #5–#9.
- **Trạng thái chuyển tiếp**: trong khi #5/#6 chưa làm, dữ liệu sessions/attendance/homework vẫn ở localStorage — chấp nhận trạng thái hỗn hợp tạm thời vì dữ liệu chỉ là mock.
