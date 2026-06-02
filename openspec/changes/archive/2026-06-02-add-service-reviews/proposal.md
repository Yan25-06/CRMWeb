## Why

Tiếp nối #4–#7, nhóm nhận xét học sinh — `reviews` (đánh giá kỹ năng + tags theo ngày), `session_reviews` (nhận xét theo buổi), `general_comments` (nhận xét chung theo lớp) — cần chuyển sang service layer để rời localStorage. Đây là nhóm service layer cuối trước change cutover #9.

## What Changes

- Thêm `reviewService`, `sessionReviewService`, `generalCommentService` async trả Promise, bọc `supabase.from(...)`.
- `reviewService`: đọc theo học sinh/lớp, upsert đánh giá theo `(student_id, class_id, date)` (gồm điểm 4 kỹ năng, `tags`, `remark`, `advice`, vắng mặt).
- `sessionReviewService`: đọc theo học sinh/lớp, thêm nhận xét theo buổi.
- `generalCommentService`: đọc một nhận xét chung theo `(student_id, class_id)`, upsert nội dung.
- Chuyển component tiêu thụ sang async: `ReviewsPage`, `GeneralCommentPanel`, `ClassOverviewTable`, `ReportCardModal`, và phần review của `StudentDetailPanel` (panel chuyên cần/homework đã chuyển ở #5/#6).
- Gỡ import `reviews`/`session_reviews`/`general_comments` từ `db.js` ở component đã chuyển; **không** xóa `db.js`.

Phạm vi: **chỉ** ba entity reviews. KHÔNG gồm: mock-test/settings + xóa `db.js` (#9), banner offline toàn cục.

## Capabilities

### New Capabilities
- `backend-data`: Service layer async cho `reviews`, `session_reviews`, `general_comments`; upsert đánh giá và nhận xét chung idempotent; xử lý cột mảng `tags`; UI không gọi `supabase.*` trực tiếp.

### Modified Capabilities
<!-- Không có. -->

## Impact

- **Code mới**: `src/services/reviewService.js`, `sessionReviewService.js`, `generalCommentService.js`.
- **Code sửa**: `ReviewsPage`, `GeneralCommentPanel`, `ClassOverviewTable`, `ReportCardModal`, `StudentDetailPanel` (phần review) sang async (loading/error).
- **Phụ thuộc**: cần #1 (schema), #3 (RLS), #4 (học sinh/lớp); `session_reviews.session_id` tham chiếu buổi học từ #5.
- **Rủi ro**: thấp–trung bình — cần xử lý đúng cột `tags text[]` (mảng) khi đọc/ghi và upsert đúng khóa kép.
