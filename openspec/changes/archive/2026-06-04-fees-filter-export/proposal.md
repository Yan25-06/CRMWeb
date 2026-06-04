## Why

`FeesPage` hiện liệt kê tất cả học sinh trong tháng nhưng không có cách lọc nhanh ai còn nợ / đã đóng / đóng một phần, khiến giáo viên phải dò mắt qua cả bảng để biết cần nhắc ai. Bảng học phí tháng cũng chưa xuất ra Excel/PDF được để lưu trữ hay gửi. Tương tự, `StudentsDirectoryPage` cho lọc/tìm nhưng không xuất được danh sách đang hiển thị. Cả ba đều là thao tác "lấy dữ liệu đang có → lọc/xuất", không cần schema mới — gom chung một change.

## What Changes

- **F1** `FeesPage`: thêm bộ lọc trạng thái thanh toán — **Tất cả / Còn nợ / Đã đóng đủ / Đóng một phần**. Lọc client-side trên dữ liệu tháng hiện tại, kèm đếm số HS mỗi nhóm.
- **C1** `FeesPage`: thêm nút xuất **Excel** và **PDF** cho bảng học phí tháng hiện tại (tái dùng `ExportButtons` + `xlsx`/`jspdf`). Xuất theo bộ lọc đang áp dụng.
- **J1** `StudentsDirectoryPage`: thêm nút xuất **Excel** cho danh sách học sinh đang hiển thị (sau khi đã lọc/tìm kiếm).

## Capabilities

### Modified Capabilities
- `pages`: `FeesPage` có bộ lọc trạng thái thanh toán và nút xuất Excel/PDF; `StudentsDirectoryPage` có nút xuất Excel danh sách đang hiển thị.

## Impact

- **UI:** `src/pages/FeesPage.jsx` (+ `FeesTable`/toolbar), `src/pages/StudentsDirectoryPage.jsx`.
- **Component:** tái dùng `ExportButtons` từ `@/components/ui`, thư viện `xlsx` + `jspdf`/`html2canvas` (đã có).
- **Data:** lọc/đếm client-side từ dữ liệu đã load; không thêm truy vấn/service mới, không gọi `supabase` trực tiếp.
- **Không ảnh hưởng:** data model, DB, công thức học phí.
