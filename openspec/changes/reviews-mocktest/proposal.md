## Why

Bảng tổng quan lớp trong `ReviewsPage` (`ClassOverviewTable`) cho giáo viên cái nhìn nhanh cả lớp nhưng chưa gắn kết quả mock test — thông tin quan trọng nhất để đánh giá tiến bộ. Giáo viên phải mở từng học sinh hoặc sang tab MockTest mới biết điểm. Đồng thời sidebar học sinh trong `MockTestTab` không có ô tìm kiếm như `ReviewsPage`, nên lớp đông khó tìm. Cả hai đều xoay quanh dữ liệu mock test/đánh giá, gom chung một change.

## What Changes

- **C3** `ReviewsPage → ClassOverviewTable`: thêm 2 cột — (1) **điểm mock test gần nhất** của mỗi học sinh, (2) **chênh lệch** so với lần mock trước (▲/▼ + giá trị, màu xanh/đỏ). Học sinh chưa có mock hiển thị "—".
- **H2** `ClassDetailPage → MockTestTab`: thêm **ô tìm kiếm** trong sidebar học sinh (lọc theo tên, dùng `useDebounce` như `ReviewsPage`).

## Capabilities

### Modified Capabilities
- `pages`: `ClassOverviewTable` bổ sung cột điểm mock gần nhất + chênh lệch; `MockTestTab` có ô tìm kiếm học sinh trong sidebar.

## Impact

- **UI:** `src/pages/ReviewsPage.jsx` (+ `ClassOverviewTable`), `src/pages/ClassDetailPage/tabs/MockTestTab.jsx`.
- **Data:** tái dùng `mockTestService` + `mockTestResultService` để lấy 2 kết quả mock gần nhất / học sinh; tính chênh lệch client-side. Không gọi `supabase` trực tiếp.
- **Component:** tái dùng `Input`/icon search + `useDebounce` (đã có).
- **Không ảnh hưởng:** data model, DB, công thức điểm.
