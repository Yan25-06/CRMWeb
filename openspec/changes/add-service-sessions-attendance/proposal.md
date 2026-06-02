## Why

Sau khi `students`/`classes`/`enrollments` đã lên Supabase (#4), nhóm vận hành lớp học hàng ngày — `sessions`, `attendance`, `schedule` — cần chuyển sang service layer. Đây cũng là nơi đầu tiên cần **optimistic UI**: điểm danh là thao tác tần suất cao, giáo viên gõ liên tục nên không thể chờ round-trip mỗi lần tích.

## What Changes

- Thêm `sessionService`, `attendanceService`, `scheduleService` async trả Promise, bọc `supabase.from(...)`.
- `attendanceService` hỗ trợ upsert điểm danh theo `(session_id, student_id)` và cập nhật **optimistic**: UI đổi ngay khi tích, rollback nếu server từ chối.
- Chuyển component tiêu thụ sang async: `SchedulePage`, `AttendanceTab`, `SessionModal`, `StudentAttendancePanel`, và `AttendancePanel` (trong Reviews).
- Các tính toán dẫn xuất (tỉ lệ chuyên cần, đếm buổi theo tháng/khoảng) chuyển thành hàm async trong `attendanceService` hoặc tính từ dữ liệu đã nạp.
- Gỡ import `sessions`/`attendance`/`schedule` từ `db.js` ở component đã chuyển; **không** xóa `db.js`.

Phạm vi: **chỉ** sessions/attendance/schedule + optimistic điểm danh. KHÔNG gồm: homework (#6), banner offline toàn cục (#9), xóa `db.js`.

## Capabilities

### New Capabilities
- `backend-data`: Service layer async cho `sessions`, `attendance`, `schedule`; optimistic update + rollback cho thao tác điểm danh; UI không gọi `supabase.*` trực tiếp.

### Modified Capabilities
<!-- Không có. -->

## Impact

- **Code mới**: `src/services/sessionService.js`, `attendanceService.js`, `scheduleService.js`.
- **Code sửa**: `SchedulePage`, `AttendanceTab`, `SessionModal`, `StudentAttendancePanel`, `AttendancePanel` sang async; logic điểm danh dùng optimistic state.
- **Phụ thuộc**: cần #1 (schema), #3 (RLS), và #4 (services cho lớp/học sinh mà sessions/attendance tham chiếu). Tiền đề cho phần điểm danh ở #8 (reviews).
- **Rủi ro**: optimistic sai có thể hiển thị trạng thái lệch với DB nếu rollback thiếu sót — cần test kỹ đường lỗi.
