## 1. sessionService

- [x] 1.1 `getByClass(classId)` — select `sessions` theo `class_id`, sắp theo `date`
- [x] 1.2 `getById(id)` — một buổi học
- [x] 1.3 `create(data)` — insert buổi học (kèm `schedule_item_id` nếu tạo từ lịch)
- [x] 1.4 `update(id, data)`, `remove(id)`

## 2. attendanceService

- [x] 2.1 `getBySession(sessionId)` — bản ghi điểm danh của một buổi
- [x] 2.2 `getByStudent(studentId)` / `getByRange(studentId, classId, from, to)` phục vụ thống kê
- [x] 2.3 `upsert(record)` — upsert theo `(session_id, student_id)` cập nhật `present`/`note`
- [x] 2.4 Hàm thống kê dẫn xuất (tỉ lệ chuyên cần, đếm buổi) tính trên dữ liệu đã nạp hoặc qua `getByRange`

## 3. scheduleService

- [x] 3.1 `getAll()` / `getByDay(dayOfWeek)`
- [x] 3.2 `add(data)`, `update(id, data)`, `remove(id)`

## 4. Optimistic điểm danh ở UI

- [x] 4.1 `AttendanceTab` — lưới điểm danh giữ state cục bộ; tích → cập nhật ngay → `attendanceService.upsert`
- [x] 4.2 Rollback theo từng ô `(session_id, student_id)` khi upsert reject + toast lỗi
- [x] 4.3 Xác nhận nhiều ô bay đồng thời rollback đúng ô lỗi, không đè ô khác

## 5. Chuyển UI sang service async

- [x] 5.1 `SessionModal` — tạo/sửa buổi học qua `sessionService`
- [x] 5.2 `SchedulePage` — nạp/sửa lịch qua `scheduleService` (loading/error)
- [x] 5.3 `StudentAttendancePanel` — nạp điểm danh + thống kê qua `attendanceService`
- [x] 5.4 `AttendancePanel` (Reviews) — nạp điểm danh theo khoảng qua service
- [x] 5.5 Gỡ import `sessions`/`attendance`/`schedule` từ `db.js` ở file đã chuyển; KHÔNG xóa `db.js`

## 6. Kiểm tra & bàn giao change

- [x] 6.1 Chạy `openspec validate add-service-sessions-attendance` và rà từng requirement đã được task/test nào phủ
- [x] 6.2 Tổng kết cho người dùng: những gì change này đã làm (service layer cho sessions/attendance/schedule, optimistic điểm danh + rollback, UI nạp async) và những gì CHƯA thuộc phạm vi (homework ở #6, banner offline toàn cục + retry queue + xóa `db.js` ở #9)
- [x] 6.3 Viết hướng dẫn test thủ công cho người dùng và cùng chạy qua:
  - Đăng nhập teacher A → tạo buổi học cho lớp của A → thấy buổi học trong `ClassDetailPage`
  - Mở `AttendanceTab` → tích điểm danh → ô đổi trạng thái ngay lập tức (không chờ server)
  - Mô phỏng lỗi mạng (DevTools → Offline) → tích điểm danh → ô rollback về trước + hiển thị thông báo lỗi
  - Tích nhiều ô cùng lúc khi offline → từng ô rollback đúng, không đè ô khác
  - Đăng nhập teacher B → buổi học và điểm danh của A không xuất hiện
  - `SchedulePage`: thêm/sửa/xóa mục lịch → hoạt động qua `scheduleService`
  - `StudentAttendancePanel`: thống kê chuyên cần hiển thị đúng sau khi nạp từ Supabase
- [x] 6.4 Ghi lại kết quả test + vấn đề tồn đọng; xác nhận với người dùng trước khi sang #6 (homework)
