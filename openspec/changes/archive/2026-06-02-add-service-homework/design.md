## Context

Change service-layer thứ ba, sau #4 (lớp/học sinh) và #5 (buổi học/điểm danh). Homework gồm ba bảng: `homeworks` (tiến độ theo `session_id` + `student_id`), `hw_assignments` (bài giao theo `class_id`), `submissions` (nộp/chấm theo `hw_assignment_id` + `student_id`). RLS suy quyền qua bảng cha (#3). `supabase` client + `useAuth` sẵn sàng.

## Goals / Non-Goals

**Goals:**
- Service async cho ba bảng homework theo cùng quy ước #4/#5.
- Chuyển các component homework sang nạp async.

**Non-Goals:**
- Optimistic UI cho homework — dùng load-then-confirm (điểm danh ở #5 mới cần optimistic vì tần suất cao).
- Banner offline + retry (thuộc #9).
- Xóa `db.js`.

## Decisions

**1. Ba file service, cùng quy ước các change trước.**
`homeworkService`, `hwAssignmentService`, `submissionService` export hàm async bọc `supabase.from(...)`, ném `Error` khi lỗi, không filter quyền ở client (RLS lo).

**2. Cập nhật tiêu đề theo buổi thực hiện trong service.**
`homeworkService.updateSessionTitle(sessionId, title)` cập nhật `title` cho các bản ghi homework cùng `session_id` bằng một câu update có điều kiện, tránh nhiều round-trip từng bản ghi.

**3. Xóa submission khi xóa bài giao dựa vào cascade DB.**
Schema đã đặt `submissions.hw_assignment_id ... on delete cascade`. `hwAssignmentService.remove(id)` chỉ cần xóa bài giao; submission tự xóa theo. `submissionService.deleteByAssignment` giữ lại cho luồng xóa thủ công nếu cần.

**4. Thống kê hoàn thành tính client.**
`getStats` fetch homework của học sinh/lớp rồi tính tỉ lệ done ở client, nhất quán với cách #5 xử lý thống kê chuyên cần.

## Risks / Trade-offs

- **Upsert sai khóa kép** → trùng bản ghi nộp/chấm. Mitigation: upsert chỉ định đúng `onConflict: 'hw_assignment_id,student_id'` / `'session_id,student_id'` theo unique constraint của schema.
- **Phụ thuộc cascade DB** cho xóa submission — nếu schema đổi, hành vi đổi. Mitigation: ghi rõ trong service phần dựa vào cascade.
- **Trạng thái hỗn hợp** với fees/reviews/mock-test chưa migrate — chấp nhận vì mock data, các nhóm đó ở #7/#8/#9.
