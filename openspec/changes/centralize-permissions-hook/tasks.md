## 1. Tạo hook

- [ ] 1.1 Tạo `src/hooks/usePermissions.js` đọc `useAuth()`, tính `isAdmin = !!teacher?.is_admin`
- [ ] 1.2 Export các cờ ngữ nghĩa: `isAdmin`, `canViewFees`, `canAccessAdmin`, `canManageCenterSettings`, `canManageStudents`, `canCreateMockTest`, `canManageClasses`, `canFilterByTeacher`

## 2. Refactor permission check của caller

- [ ] 2.1 `Navbar.jsx`: dùng `usePermissions()` thay vì prop `isAdmin`; bỏ prop `isAdmin` tại chỗ `App.jsx` render `<Navbar>`
- [ ] 2.2 `App.jsx`: route guard `admin`/`fees` dùng `canAccessAdmin`/`canViewFees`
- [ ] 2.3 `AdminPanelPage.jsx`: guard truy cập trang (line ~133) dùng `canAccessAdmin`
- [ ] 2.4 `SettingsPage.jsx`: section "Thông tin trung tâm" dùng `canManageCenterSettings`
- [ ] 2.5 `SchedulePage.jsx`: bộ lọc theo giáo viên dùng `canFilterByTeacher`
- [ ] 2.6 `ClassesOverviewPage.jsx`: tạo/xóa lớp + cột giáo viên dùng `canManageClasses`

## 3. Giữ nguyên (không động vào — verify còn đúng)

- [ ] 3.1 Xác nhận KHÔNG sửa `classService.js` (`setAdmin`, `select(...is_admin)`)
- [ ] 3.2 Xác nhận KHÔNG sửa chỗ `AdminPanelPage` render/toggle `t.is_admin` của giáo viên khác
- [ ] 3.3 Xác nhận KHÔNG sửa prop `isAdmin` của `ClassModal`

## 4. Kiểm thử & tài liệu

- [ ] 4.1 Chạy app với tài khoản admin: menu Fees/Admin hiện, route vào được, section/nút quản lý đầy đủ — khớp hành vi cũ
- [ ] 4.2 Chạy app với tài khoản teacher: menu Fees/Admin ẩn, route bị chặn về dashboard, section trung tâm ẩn, lọc giáo viên ẩn — khớp hành vi cũ
- [ ] 4.3 Cập nhật `CLAUDE.md`: quy ước check quyền UI qua `usePermissions()`, không đọc `teacher.is_admin` trực tiếp trong component
