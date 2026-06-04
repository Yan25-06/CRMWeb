## 1. Dữ liệu mock test cho ClassOverviewTable

- [x] 1.1 Trích/áp dụng hàm tính điểm tổng một bài mock (tái dùng từ `MockTestTab`)
- [x] 1.2 `ReviewsPage` load mock tests + results của lớp, dựng map `studentId → [kết quả theo thời gian]`

## 2. Hai cột mới (C3)

- [x] 2.1 Thêm cột "Điểm mock gần nhất" vào `ClassOverviewTable` (— khi chưa có)
- [x] 2.2 Thêm cột "Chênh lệch" so với bài trước: ▲/▼ + giá trị, màu xanh/đỏ (— khi ≤1 bài)
- [x] 2.3 Xác định thứ tự bài theo ngày rồi `createdAt` cho ổn định

## 3. Ô tìm kiếm MockTestTab (H2)

- [x] 3.1 Thêm `Input` + icon search + `useDebounce` vào sidebar `MockTestTab`
- [x] 3.2 Lọc danh sách học sinh theo tên, nhất quán cách `ReviewsPage` (hoa/thường, bỏ dấu nếu có)
- [x] 3.3 Trạng thái rỗng khi không khớp

## 4. Kiểm thử

- [x] 4.1 Test cột mock: HS có nhiều bài / 1 bài / chưa có; dấu chênh lệch + màu đúng
- [x] 4.2 Test tìm kiếm sidebar MockTestTab lọc đúng, debounce hoạt động
