## Context

Tiếp nối #4 (students/classes/enrollments đã lên Supabase). Nhóm này — `sessions`, `attendance`, `schedule` — là vận hành lớp hàng ngày. Điểm danh là thao tác tần suất cao (tích nhiều học sinh liên tiếp), nên đây là nơi đầu tiên áp optimistic UI theo lộ trình. `supabase` client + `useAuth` đã sẵn sàng; RLS suy quyền cho ba bảng này qua `class_id`/`student_id` (#3).

## Goals / Non-Goals

**Goals:**
- Service async cho sessions/attendance/schedule, cô lập `supabase` khỏi UI.
- Optimistic update + rollback cho thao tác điểm danh.
- Chuyển các component liên quan sang nạp async.

**Non-Goals:**
- Banner offline toàn cục + retry queue (thuộc #9) — change này chỉ rollback cục bộ khi một upsert lỗi.
- Optimistic cho mọi thao tác (chỉ điểm danh); tạo/sửa buổi học và lịch dùng load-then-confirm.
- Xóa `db.js`.

## Decisions

**1. Ba file service, theo cùng quy ước #4.**
`sessionService`, `attendanceService`, `scheduleService` export hàm async bọc `supabase.from(...)`, ném `Error` khi có lỗi, không filter quyền ở client.

**2. Optimistic điểm danh ở tầng component, không ở service.**
Service chỉ cung cấp `upsert(record)` thuần. Component giữ state cục bộ của lưới điểm danh: khi tích, cập nhật state ngay → gọi `attendanceService.upsert` → nếu reject, set lại giá trị cũ + hiện toast lỗi. Tách biệt giúp service không trạng thái, dễ test và tái dùng.

**3. Tính toán dẫn xuất tính trên dữ liệu đã nạp, hoặc query gọn.**
Tỉ lệ chuyên cần / đếm buổi (trước ở `db.js` tính đồng bộ trên mảng) chuyển thành: hoặc tính từ mảng attendance đã fetch của lớp, hoặc thêm hàm `attendanceService.getByRange(...)`. Tránh nhiều round-trip nhỏ — fetch theo lớp/khoảng rồi tính client.

**4. `schedule_item_id` trên sessions giữ nguyên liên kết lịch↔buổi.**
Khi tạo buổi từ một mục lịch, service truyền `schedule_item_id`; không xử lý sinh buổi tự động trong change này (giữ hành vi hiện có của UI lịch).

**5. Mô hình điểm danh nhị phân, mặc định "Có mặt".**
Cột `attendance.present` là `NOT NULL`, nên bỏ trạng thái "Chưa chấm" (`null`) của hệ localStorage cũ. Mọi học sinh được coi là **có mặt** trừ khi giáo viên tick "Vắng" (`present = false`). Hệ quả: chỉ cần lưu bản ghi cho HS vắng (lazy records), và mọi nơi tính thống kê đều dùng quy ước **mẫu số = số buổi học**, "vắng khi `present === false`, còn lại có mặt" (kể cả buổi chưa có bản ghi). `AttendanceToggle` chuyển thành toggle 2 trạng thái Có↔Vắng.

## Risks / Trade-offs

- **Rollback optimistic phải đúng** — nếu nhiều ô điểm danh đang bay cùng lúc, cần rollback đúng ô lỗi mà không đè ô khác. Mitigation: rollback theo khóa `(session_id, student_id)`, lưu giá trị trước theo từng ô.
- **Trạng thái hỗn hợp với homework chưa migrate (#6)** — buổi học ở Supabase nhưng homework theo buổi còn ở localStorage tới #6. Chấp nhận tạm vì mock data; làm #6 ngay sau.
- **Không có retry tự động** — một upsert lỗi chỉ rollback + báo lỗi; giáo viên tích lại. Retry/queue để #9. Đánh đổi đơn giản hóa.
- **Thống kê tính client** — với lớp nhiều buổi, fetch lớn hơn; chấp nhận ở quy mô hiện tại.
