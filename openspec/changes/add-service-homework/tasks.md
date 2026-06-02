## 1. homeworkService

- [ ] 1.1 `getBySession(sessionId)` — homework theo `session_id`
- [ ] 1.2 `getByStudent(studentId, classId)` — homework của một học sinh trong lớp
- [ ] 1.3 `update(id, data)` — cập nhật tiến độ/ghi chú một bản ghi
- [ ] 1.4 `updateSessionTitle(sessionId, title)` — cập nhật `title` cho các bản ghi cùng buổi
- [ ] 1.5 `getStats(studentId, classId)` — tính tỉ lệ hoàn thành (client) từ dữ liệu đã nạp

## 2. hwAssignmentService

- [ ] 2.1 `getByClass(classId)` — bài giao theo `class_id`
- [ ] 2.2 `create(data)`, `update(id, data)`
- [ ] 2.3 `remove(id)` — xóa bài giao (submission tự xóa qua cascade DB)

## 3. submissionService

- [ ] 3.1 `getByAssignment(hwAssignmentId)`, `getByStudent(studentId)`
- [ ] 3.2 `upsert(data)` — upsert theo `(hw_assignment_id, student_id)` (`onConflict`)
- [ ] 3.3 `deleteByAssignment(hwAssignmentId)` — cho luồng xóa thủ công

## 4. Chuyển UI sang service async

- [ ] 4.1 `HomeworkTab` — nạp bài giao + submission qua service; tạo/sửa/xóa bài giao, chấm điểm qua service
- [ ] 4.2 `StudentHomeworkPanel` — nạp homework + thống kê của học sinh qua service
- [ ] 4.3 `SubmissionTable` — nạp/chấm submission qua `submissionService`
- [ ] 4.4 `HomeworkPanel` (Reviews) — nạp homework theo khoảng qua service
- [ ] 4.5 Gỡ import `homeworks`/`hw_assignments`/`submissions` từ `db.js` ở file đã chuyển; KHÔNG xóa `db.js`

## 5. Kiểm tra & bàn giao change

- [ ] 5.1 Chạy `openspec validate add-service-homework` và rà từng requirement đã được task/test nào phủ
- [ ] 5.2 Tổng kết cho người dùng: những gì change này đã làm (service layer cho homeworks/hw_assignments/submissions, upsert idempotent, xóa cascade qua DB, UI nạp async) và những gì CHƯA thuộc phạm vi (fees ở #7, reviews ở #8, mock-test/settings + xóa `db.js` ở #9)
- [ ] 5.3 Viết hướng dẫn test thủ công cho người dùng và cùng chạy qua:
  - Đăng nhập teacher A → mở `HomeworkTab` của một lớp → danh sách bài giao và submission nạp từ Supabase
  - Tạo bài giao → hiện ngay trong danh sách; sửa/xóa bài giao → hoạt động; xóa bài giao → submission liên quan biến mất (cascade)
  - Chấm điểm một học sinh → upsert thành công; chấm lại cùng học sinh/bài giao → không tạo bản ghi trùng (kiểm qua Supabase Table Editor)
  - `StudentHomeworkPanel`: thống kê hoàn thành hiển thị đúng số `done`/tổng sau khi nạp từ Supabase
  - Đăng nhập teacher B → bài giao và submission của A không xuất hiện
  - `HomeworkPanel` (Reviews): nạp homework theo khoảng ngày hoạt động đúng
- [ ] 5.4 Ghi lại kết quả test + vấn đề tồn đọng; xác nhận với người dùng trước khi sang #7 (fees)
