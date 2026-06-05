## Why

Hiện giáo viên thường có toàn quyền tạo/sửa/xóa học sinh và tạo/sửa/xóa đề Mock Test trong phạm vi lớp mình. Trung tâm muốn siết lại: học sinh và đề kiểm tra do quản lý (admin) làm chủ, giáo viên chỉ thực thi việc dạy (điểm danh, nhập điểm, giao bài). Việc này tránh giáo viên vô tình sửa/xóa dữ liệu danh bạ học viên hoặc đề chung.

## What Changes

- **BREAKING (quyền teacher):** Giáo viên thường mất quyền **INSERT/UPDATE/DELETE** trên bảng `students`. Chỉ còn **SELECT**. Áp dụng ở cả trang Danh bạ học viên (`StudentsDirectoryPage`) lẫn tab Học Viên trong lớp (`StudentsTab`).
- **BREAKING (quyền teacher):** Giáo viên thường mất quyền **INSERT/UPDATE/DELETE** trên bảng `mock_tests` (đề). Vẫn giữ nguyên quyền đầy đủ trên `mock_test_results` (nhập/sửa điểm).
- Luồng ghi danh (enrollment): bỏ khả năng **tạo học sinh mới** cho giáo viên — giáo viên chỉ được gắn học sinh đã có vào lớp, không tạo học sinh từ form ghi danh.
- UI ẩn/disable mọi nút thêm/sửa/xóa học sinh và tạo/sửa/xóa Mock Test khi `!is_admin`; giữ nút "Nhập điểm" và các nút edit/delete enrollment nếu vẫn được phép (xem design).
- Admin **không đổi** — giữ toàn quyền ghi trên mọi bảng (policy admin độc lập đã có).

## Capabilities

### New Capabilities
<!-- Không có capability mới -->

### Modified Capabilities
- `authorization`: Thu hẹp quyền ghi của teacher — `students` và `mock_tests` trở thành read-only với teacher (chỉ admin ghi được), trong khi các bảng nghiệp vụ khác (điểm danh, bài tập, `mock_test_results`, nhận xét...) giữ nguyên quyền ghi của teacher.

## Impact

- **Migration mới** (`supabase/migrations/`): drop 3 policy teacher write (`insert/update/delete`) trên `students` và 3 policy tương tự trên `mock_tests`. Giữ nguyên policy SELECT của teacher và toàn bộ policy admin.
- **UI**:
  - `src/pages/StudentsDirectoryPage.jsx`: ẩn quick-add, "Thêm học sinh", "Import Excel", "Xóa hàng loạt", và edit/delete trong sidebar khi không phải admin.
  - `src/pages/ClassDetailPage/tabs/StudentsTab.jsx` + `StudentSidebar`/`StudentDetailPanel`/`EnrollmentModal`: ẩn nút thêm học viên / sửa thông tin học sinh; chặn tạo học sinh mới trong luồng ghi danh.
  - `src/pages/ClassDetailPage/tabs/MockTestTab.jsx` + `MockTestCard`: ẩn "Tạo Mock Test mới" và edit/delete đề; giữ nhập điểm.
  - `src/App.jsx`: truyền `isAdmin` xuống `StudentsDirectoryPage` và `ClassDetailPage` (hiện chỉ Navbar nhận).
- **Service layer**: không đổi shape; RLS tự chặn ở DB, service `throw` lỗi nếu gọi sai quyền.
- **Seed/CLAUDE.md/README**: cập nhật mô tả vai trò teacher (read-only students + mock test).
