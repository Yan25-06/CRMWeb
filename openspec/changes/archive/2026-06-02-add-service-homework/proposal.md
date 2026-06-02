## Why

Tiếp nối #4 (lớp/học sinh) và #5 (buổi học/điểm danh), nhóm bài tập về nhà — `homeworks` (tiến độ theo buổi/học sinh), `hw_assignments` (bài giao theo lớp), `submissions` (nộp & chấm) — cần chuyển sang service layer để rời localStorage. Homework tham chiếu `session_id`/`class_id`/`student_id` nên phải đi sau #4 và #5.

## What Changes

- Thêm `homeworkService`, `hwAssignmentService`, `submissionService` async trả Promise, bọc `supabase.from(...)`.
- `homeworkService`: đọc theo buổi/học sinh, cập nhật tiến độ một bản ghi, cập nhật tiêu đề homework theo buổi, và thống kê hoàn thành.
- `hwAssignmentService`: đọc theo lớp, tạo, cập nhật, xóa bài giao.
- `submissionService`: đọc theo bài giao/học sinh, upsert (nộp + chấm điểm) theo `(hw_assignment_id, student_id)`, xóa theo bài giao.
- Chuyển component tiêu thụ sang async: `HomeworkTab`, `StudentHomeworkPanel`, `SubmissionTable`, `HomeworkPanel` (Reviews).
- Gỡ import `homeworks`/`hw_assignments`/`submissions` từ `db.js` ở component đã chuyển; **không** xóa `db.js`.

Phạm vi: **chỉ** ba entity homework. KHÔNG gồm: fees/reviews/mock-test, banner offline toàn cục (#9), xóa `db.js`.

## Capabilities

### New Capabilities
- `backend-data`: Service layer async cho `homeworks`, `hw_assignments`, `submissions`; upsert nộp/chấm idempotent; UI không gọi `supabase.*` trực tiếp.

### Modified Capabilities
<!-- Không có. -->

## Impact

- **Code mới**: `src/services/homeworkService.js`, `hwAssignmentService.js`, `submissionService.js`.
- **Code sửa**: `HomeworkTab`, `StudentHomeworkPanel`, `SubmissionTable`, `HomeworkPanel` sang async (loading/error).
- **Phụ thuộc**: cần #1 (schema), #3 (RLS), #4 (lớp/học sinh), #5 (buổi học mà `homeworks.session_id` tham chiếu).
- **Rủi ro**: thấp — chủ yếu CRUD; cần đảm bảo upsert đúng khóa kép để không trùng bản ghi nộp/chấm.
