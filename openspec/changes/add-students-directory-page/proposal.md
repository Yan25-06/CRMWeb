## Why

Hiện chỉ xem được học sinh theo từng lớp (tab Students trong `ClassDetailPage`). Một học sinh có thể học nhiều lớp, và giáo viên không có nơi nào để tra cứu toàn bộ học sinh, lọc/tìm nhanh, hay phát hiện học sinh đã tạo nhưng chưa xếp lớp. Cần một trang "Học sinh" top-level làm danh bạ tổng.

## What Changes

- Thêm trang top-level mới **`StudentsDirectoryPage`** (route `students`) trong Navbar, đồng nhất style với các trang hiện có (Navy + White, dùng `Card`/`Badge`/`Button`/`Input`/`Skeleton` từ `@/components/ui`).
- Bảng "Danh bạ học viên" với các cột: Học viên (avatar + tên + badge loại khóa), Trạng thái, Lớp học (badge các lớp đang ghi danh), Liên hệ (email + SĐT), Mục tiêu, Thao tác.
- Filter bar: tabs trạng thái (Tất cả / Chưa có lớp / Đang học / Tạm ngưng / Đã nghỉ), dropdown lọc theo lớp, pill lọc theo loại khóa (generate từ `classes.course_type`), ô tìm theo tên/SĐT/email.
- Actions: nút "+ Thêm học sinh" (modal chi tiết), ô "Thêm nhanh (Tên + Enter)" tạo học sinh chưa xếp lớp, **import hàng loạt từ file Excel** (`.xlsx`), bulk select để xóa hàng loạt.
- Click một dòng → sidebar chi tiết: thông tin cơ bản, danh sách lớp + trạng thái + học phí tháng hiện tại, nút "Đến lớp" điều hướng sang `ClassDetailPage`.
- **BREAKING (DB):** Thêm cột `email` (nullable) vào bảng `students`; `studentService` ánh xạ thêm `email`.

## Capabilities

### New Capabilities
- `students-directory`: Trang danh bạ học sinh tổng — liệt kê, lọc, tìm kiếm, tạo nhanh, import hàng loạt từ Excel, xem chi tiết cross-class và điều hướng tới lớp.

### Modified Capabilities
- `data`: Mô hình `Student` thêm trường `email`.
- `backend-data`: `studentService` đọc/ghi thêm cột `email`.
- `pages`: Bổ sung trang top-level "Học sinh" vào hệ thống routing/Navbar.

## Impact

- **DB migration:** `ALTER TABLE students ADD COLUMN email text` (nullable).
- **Service:** `src/services/studentService.js` (map `email`).
- **Routing/Layout:** `src/App.jsx` (case `students`), `src/components/layout/Navbar.jsx` (mục nav mới).
- **UI mới:** `src/pages/StudentsDirectoryPage.jsx` + component con (bảng, filter bar, sidebar chi tiết, modal import Excel); tái dùng `StudentModal`, `EnrollmentModal`.
- **Thư viện:** tái dùng `xlsx` (đã có sẵn cho export) để đọc file `.xlsx` khi import.
- **Không ảnh hưởng:** logic học phí, điểm danh, mock test, nhận xét.
