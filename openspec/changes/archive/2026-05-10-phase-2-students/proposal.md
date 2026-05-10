# Proposal: Phase 2 — Quản Lý Học Sinh & Lớp Học

## Status: 🔲 TODO

## Intent
Cho phép người dùng quản lý toàn bộ danh sách học sinh và lớp học:
thêm, sửa, xóa học sinh và lớp; tìm kiếm và lọc nhanh.

## Scope
- Trang StudentsPage hoàn chỉnh (thay placeholder)
- Tab học sinh + tab lớp học
- Modal thêm/sửa học sinh
- Modal thêm/sửa lớp học
- Tìm kiếm học sinh theo tên
- Lọc học sinh theo lớp

## Out of Scope
- Import học sinh từ Excel (Phase 5)
- Avatar/ảnh học sinh

## Approach
Dùng local state + db.js. Mỗi lần thêm/sửa/xóa → re-render từ localStorage.
