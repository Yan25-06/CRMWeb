## Context

Change service-layer thứ năm và cuối cùng trước cutover #9, sau #4–#7. Nhóm nhận xét gồm ba bảng: `reviews` (đánh giá theo `student_id` + `class_id` + `date`, có điểm 4 kỹ năng, `tags text[]`, vắng mặt), `session_reviews` (nhận xét theo `session_id`), `general_comments` (nhận xét chung theo `(student_id, class_id)`). RLS suy quyền qua `student_id`/`class_id` (#3). `session_reviews.session_id` tham chiếu buổi học (#5, `on delete set null`).

## Goals / Non-Goals

**Goals:**
- Service async cho ba bảng reviews theo cùng quy ước #4–#7.
- Xử lý đúng cột `tags text[]` khi đọc/ghi.
- Chuyển các component nhận xét sang nạp async.

**Non-Goals:**
- Optimistic UI cho nhận xét — dùng load-then-confirm.
- Banner offline + retry (thuộc #9).
- Xóa `db.js` (cutover #9).

## Decisions

**1. Ba file service, cùng quy ước các change trước.**
`reviewService`, `sessionReviewService`, `generalCommentService` export hàm async bọc `supabase.from(...)`, ném `Error` khi lỗi, không filter quyền ở client (RLS lo).

**2. `tags` ánh xạ trực tiếp sang mảng JS.**
`supabase-js` trả `text[]` thành mảng JS và nhận mảng JS khi ghi — không cần serialize chuỗi như localStorage cũ. Bỏ mọi bước `JSON.parse`/`join` cho `tags` khi chuyển component.

**3. Upsert theo đúng unique constraint của từng bảng.**
`reviewService.upsert` dùng `onConflict: 'student_id,class_id,date'`; `generalCommentService.upsert` dùng `onConflict: 'student_id,class_id'`. `session_reviews` không có unique → luôn insert (thêm mới, không upsert).

**4. `session_reviews` chỉ thêm, không sửa.**
Khớp hành vi cũ (`addSessionReview`): mỗi nhận xét buổi là một bản ghi mới; không có luồng cập nhật/xóa trong phạm vi này.

## Risks / Trade-offs

- **Sai kiểu cột `tags`** — nếu component cũ truyền chuỗi JSON thay vì mảng, ghi sẽ lỗi hoặc lệch. Mitigation: rà các chỗ đọc/ghi `tags` ở `ReportCardModal`/`ClassOverviewTable`, chuyển sang mảng thuần.
- **`session_id` null sau khi buổi bị xóa** — schema đặt `on delete set null`; UI phải xử lý nhận xét buổi có `session_id` null. Mitigation: hiển thị "buổi đã xóa" thay vì lỗi.
- **Trạng thái hỗn hợp** với mock-test/settings chưa migrate — chấp nhận vì mock data; #9 sẽ dọn nốt và xóa `db.js`.
