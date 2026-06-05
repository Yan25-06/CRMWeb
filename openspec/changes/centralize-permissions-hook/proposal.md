## Why

Logic phân quyền của người dùng hiện tại nằm rải rác: mỗi nơi tự đọc `teacher?.is_admin` theo một biến thể khác nhau (`teacher?.is_admin`, `teacher?.is_admin === true`, `!!teacher?.is_admin`) rồi suy ra "được làm gì". Mỗi khi thêm quy tắc mới (như change `restrict-teacher-readonly-students` sắp thêm ~6-7 chỗ), phải lùng từng component — khó audit, dễ quên, dễ lệch nhất quán giữa các màn hình. Cần một nguồn chân lý duy nhất ở client.

## What Changes

- Thêm hook `src/hooks/usePermissions.js` đọc `teacher` từ `useAuth()` và trả về các cờ **ngữ nghĩa** (semantic flags) thay vì cờ kỹ thuật `is_admin`: ví dụ `canViewFees`, `canAccessAdmin`, `canManageCenterSettings`, `canManageStudents`, `canCreateMockTest`, `canManageClasses`, `canFilterByTeacher`, kèm `isAdmin` thô để tương thích.
- Refactor các nơi **check quyền của người dùng hiện tại** sang dùng `usePermissions()`:
  - `src/App.jsx` — route guard `admin`/`fees`.
  - `src/components/layout/Navbar.jsx` — ẩn menu Fees/Admin.
  - `src/pages/AdminPanelPage.jsx` — guard truy cập trang (line ~133).
  - `src/pages/SettingsPage.jsx` — hiện section "Thông tin trung tâm".
  - `src/pages/SchedulePage.jsx` — bộ lọc theo giáo viên (admin-only).
  - `src/pages/ClassesOverviewPage.jsx` — tạo/xóa lớp, hiện cột giáo viên.
- **KHÔNG đổi** các chỗ không phải permission check của người dùng hiện tại:
  - `classService.js` (`setAdmin`, `select(...is_admin)`) — thao tác dữ liệu.
  - `AdminPanelPage` chỗ render/toggle `t.is_admin` của **giáo viên khác** trong danh sách — đây là dữ liệu, không phải quyền của caller.
  - `ClassModal` prop `isAdmin` — prop ngữ cảnh của component tái dùng (đôi khi hardcode `true` từ AdminPanel).
- Không đổi hành vi quan sát được — đây là refactor cấu trúc. Cùng input → cùng UI hiển thị như trước.

## Capabilities

### New Capabilities
<!-- Không có capability mới -->

### Modified Capabilities
- `authorization`: Thêm một yêu cầu về **nguồn chân lý phân quyền ở client** — mọi quyết định ẩn/hiện theo quyền trên UI SHALL suy ra từ một hook tập trung, đảm bảo nhất quán giữa các màn hình. (Không đổi quyền thực ở DB/RLS — đó vẫn là nguồn chân lý bảo mật.)

## Impact

- **Mới:** `src/hooks/usePermissions.js`.
- **Sửa (refactor, không đổi hành vi):** `App.jsx`, `Navbar.jsx`, `AdminPanelPage.jsx`, `SettingsPage.jsx`, `SchedulePage.jsx`, `ClassesOverviewPage.jsx`.
- **Phụ thuộc:** không thêm dependency. Chỉ dựa trên `useAuth()` đã có.
- **Quan hệ với change khác:** `restrict-teacher-readonly-students` nên triển khai dựa trên các cờ của hook này (`canManageStudents`, `canCreateMockTest`) thay vì drill prop `isAdmin`. Nếu change đó apply trước, sẽ refactor tiếp ở change này; nếu change này apply trước, change kia dùng hook luôn.
- **Tài liệu:** cập nhật `CLAUDE.md` mục phân quyền — quy ước "check quyền UI qua `usePermissions()`, không đọc `teacher.is_admin` trực tiếp trong component".
