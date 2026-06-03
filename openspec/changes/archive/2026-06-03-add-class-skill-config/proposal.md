## Why

Phần đánh giá kỹ năng (Review) hiện hardcode đúng 4 kỹ năng IELTS (Nghe/Nói/Đọc/Viết) thang 0–9, trong khi Mock Test cho phép tùy chỉnh phần thi tự do (`sections` jsonb). Hai hệ thống không đồng bộ: lớp TOEIC hoặc lớp Giao tiếp vẫn bị buộc nhập 4 kỹ năng IELTS vô nghĩa, và không thể đối chiếu điểm đánh giá với kết quả thi thật. Cần một nguồn định nghĩa kỹ năng chung ở cấp lớp để cả Review và Mock Test cùng tuân theo.

## What Changes

- Thêm cấu hình kỹ năng (`skillConfig`) ở cấp **lớp học**: danh sách `{ name, maxScore, order }`, mặc định 4 kỹ năng IELTS thang 0–9.
- **BREAKING (DB):** Bảng `reviews` chuyển từ 4 cột cố định (`listen_score`, `speak_score`, `read_score`, `write_score`) sang một cột `scores` (jsonb) keyed theo tên kỹ năng — đồng bộ cấu trúc với `mock_test_results.scores`. Không cần bảo toàn dữ liệu cũ (chưa có dữ liệu quan trọng).
- `ClassModal` thêm trình chỉnh sửa kỹ năng (tái dùng `MockTestSectionBuilder`).
- `ReviewForm` render các ô nhập điểm động theo `skillConfig` của lớp, validate theo `maxScore` từng kỹ năng.
- `RadarChartPanel` vẽ trục động theo `skillConfig`, normalize điểm về % để các kỹ năng khác thang vẫn so sánh được; có thể overlay điểm Mock Test gần nhất.
- `MockTestModal` khi tạo mới tự điền sẵn `sections` theo `skillConfig` của lớp (vẫn cho chỉnh tay).

## Capabilities

### New Capabilities
- (không có capability hoàn toàn mới — đây là sửa đổi hành vi các capability hiện hữu)

### Modified Capabilities
- `data`: Mô hình `ReviewRecord` đổi từ điểm 4 kỹ năng cố định sang `scores` map động; mô hình `Class` thêm `skillConfig`.
- `backend-data`: `reviewService` đọc/ghi `scores` (jsonb) thay vì 4 cột; `classService` ánh xạ `skillConfig`.
- `pages`: Trang nhận xét (Review) và Mock Test render kỹ năng động theo cấu hình lớp thay vì 4 kỹ năng cố định.

## Impact

- **DB migrations:** thêm cột `classes.skill_config` (jsonb), đổi `reviews` (drop 4 cột điểm, thêm `scores` jsonb).
- **Services:** `src/services/classService.js`, `src/services/reviewService.js`.
- **UI:** `src/components/classes/ClassModal.jsx`, `src/components/reviews/ReviewForm.jsx`, `src/components/reviews/RadarChartPanel.jsx`, `src/components/mock-test/MockTestModal.jsx`; tái dùng `src/components/mock-test/MockTestSectionBuilder.jsx`.
- **Không ảnh hưởng:** trang Học phí, Lịch dạy, Điểm danh, Bài tập.
