## 1. reviewService

- [x] 1.1 `getByStudent(studentId, classId)` — đánh giá theo `(student_id, class_id)`, sắp theo `date`
- [x] 1.2 `upsert(data)` — upsert theo `(student_id, class_id, date)` (`onConflict`), gồm điểm 4 kỹ năng, `remark`, `advice`, vắng mặt
- [x] 1.3 Xử lý cột `tags text[]`: ghi/đọc dạng mảng JS, bỏ serialize chuỗi của localStorage cũ

## 2. sessionReviewService

- [x] 2.1 `getByStudent(studentId, classId)` — nhận xét theo buổi của học sinh trong lớp
- [x] 2.2 `add(data)` — insert một nhận xét theo buổi (kèm `session_id`), không upsert

## 3. generalCommentService

- [x] 3.1 `get(studentId, classId)` — một nhận xét chung (hoặc rỗng)
- [x] 3.2 `upsert(studentId, classId, text)` — upsert theo `(student_id, class_id)` (`onConflict`)

## 4. Chuyển UI sang service async

- [x] 4.1 `ReviewsPage` — nạp đánh giá/nhận xét qua service (loading/error)
- [x] 4.2 `ClassOverviewTable` — nạp đánh giá toàn lớp qua `reviewService`; xử lý `tags` dạng mảng
- [x] 4.3 `ReportCardModal` — nạp đánh giá + tags qua service; bỏ parse chuỗi tags cũ
- [x] 4.4 `GeneralCommentPanel` — đọc/lưu nhận xét chung qua `generalCommentService`
- [x] 4.5 `StudentDetailPanel` (phần review) — nạp đánh giá + nhận xét buổi qua service
- [x] 4.6 Gỡ import `reviews`/`session_reviews`/`general_comments` từ `db.js` ở file đã chuyển; KHÔNG xóa `db.js`

## 5. Kiểm tra & bàn giao change

- [x] 5.1 Chạy `openspec validate add-service-reviews` và rà từng requirement đã được task/test nào phủ
- [x] 5.2 Tổng kết cho người dùng: những gì change này đã làm (service layer cho reviews/session_reviews/general_comments, upsert idempotent, xử lý cột tags mảng, UI nạp async) và những gì CHƯA thuộc phạm vi (mock-test/settings + banner offline + xóa `db.js` ở #9)
- [x] 5.3 Viết hướng dẫn test thủ công cho người dùng và cùng chạy qua:
  - Đăng nhập teacher A → mở `ReviewsPage` → đánh giá của lớp A nạp từ Supabase
  - Lưu một đánh giá có nhiều tag + điểm 4 kỹ năng → lưu lại cùng học sinh/ngày → không tạo bản ghi trùng (kiểm Supabase Table Editor); tags hiển thị đúng dạng mảng
  - `GeneralCommentPanel`: lưu nhận xét chung → lưu lại → cập nhật cùng bản ghi, không trùng
  - Thêm nhận xét theo buổi → hiện trong `StudentDetailPanel`; xóa buổi học liên quan → nhận xét vẫn hiển thị (session_id null, không lỗi)
  - `ReportCardModal`: mở phiếu nhận xét → điểm/tags/nhận xét hiển thị đúng
  - Đăng nhập teacher B → đánh giá và nhận xét của A không xuất hiện
- [x] 5.4 Ghi lại kết quả test + vấn đề tồn đọng; xác nhận với người dùng trước khi sang #9 (cutover: mock-test/settings + xóa `db.js`)
