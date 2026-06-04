## 1. Bộ lọc trạng thái thanh toán (FeesPage)

- [x] 1.1 Viết hàm phân loại trạng thái mỗi HS: Đã đóng đủ / Đóng một phần / Còn nợ (F1)
- [x] 1.2 Thêm tabs lọc Tất cả / Còn nợ / Đã đóng đủ / Đóng một phần + số đếm mỗi nhóm
- [x] 1.3 Lọc bảng client-side theo tab đang chọn

## 2. Export học phí (FeesPage)

- [x] 2.1 Gắn `ExportButtons` (Excel) vào `FeesPage` (C1)
- [x] 2.2 Xuất theo danh sách đã lọc, cột: Học sinh, Lớp, Phải đóng, Đã đóng, Còn nợ, Trạng thái
- [x] 2.3 Tên file kèm tháng/năm

## 3. Export Excel (StudentsDirectoryPage)

- [x] 3.1 Thêm nút "Xuất Excel" trên `StudentsDirectoryPage` (J1)
- [x] 3.2 Xuất mảng học sinh đang hiển thị (sau lọc + tìm) qua `xlsx`, cột: Họ tên, Khối, SĐT, Email, Lớp, Trạng thái

## 4. Kiểm thử

- [x] 4.1 Test phân loại trạng thái khớp số đếm; lọc đúng từng nhóm
- [x] 4.2 Test export Excel/PDF học phí phản ánh đúng bộ lọc
- [x] 4.3 Test export Excel danh bạ phản ánh đúng lọc/tìm hiện tại
