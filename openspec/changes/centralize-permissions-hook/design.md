## Context

App phân quyền hai tầng qua `teachers.is_admin`. Client gating hiện rải rác ~6 file, mỗi nơi đọc `teacher?.is_admin` theo biến thể riêng (`=== true`, `!!`, optional chaining trần). RLS ở Postgres mới là nguồn chân lý bảo mật; lớp UI chỉ để trải nghiệm. Đây là refactor thuần — không đổi hành vi quan sát được.

Phân loại các điểm chạm `is_admin`/`isAdmin` (từ grep):
- **Permission check của caller (migrate):** `App.jsx` (route guard admin/fees), `Navbar.jsx` (ẩn menu, đang nhận qua prop), `AdminPanelPage.jsx:133` (guard trang), `SettingsPage.jsx:36` (section trung tâm), `SchedulePage.jsx:37` (lọc giáo viên), `ClassesOverviewPage.jsx:12` (tạo/xóa lớp, cột giáo viên).
- **KHÔNG phải permission check (giữ nguyên):** `classService.js` (`setAdmin`, `select(...is_admin)` — thao tác dữ liệu); `AdminPanelPage` chỗ đọc `t.is_admin` của giáo viên **khác** trong danh sách (dữ liệu hiển thị/toggle, không phải quyền caller); `ClassModal` prop `isAdmin` (prop ngữ cảnh, đôi khi hardcode `true`).

## Goals / Non-Goals

**Goals:**
- Một hook `usePermissions()` là nguồn chân lý cho gating UI.
- Cờ ngữ nghĩa theo năng lực, không phải cờ `is_admin` thô rải khắp nơi.
- Giữ nguyên hành vi: cùng người dùng → cùng UI như trước.

**Non-Goals:**
- Không đổi RLS / quyền thật ở DB.
- Không đổi `classService` hay logic toggle admin cho giáo viên khác (AdminPanel).
- Không bỏ prop `isAdmin` của `ClassModal` (component tái dùng nhận prop ngữ cảnh).
- Không thêm vai trò thứ 3 (chỉ tái cấu trúc cho dễ mở rộng sau).

## Decisions

### 1. Cờ ngữ nghĩa, không phải `isAdmin` thô
Hook trả cờ theo năng lực: `canViewFees`, `canAccessAdmin`, `canManageCenterSettings`, `canManageStudents`, `canCreateMockTest`, `canManageClasses`, `canFilterByTeacher`. Hiện tất cả đều `= isAdmin`, nhưng đặt tên theo năng lực để sau đổi rule chỉ sửa một dòng, không phải đi tìm `isAdmin` nào liên quan năng lực nào.

- Vẫn export `isAdmin` thô để tương thích chỗ thực sự cần khái niệm "là admin" (không phải năng lực cụ thể).
- **Alternative bỏ qua:** chỉ export `isAdmin` → gọn nhưng quay lại đúng vấn đề cũ (component tự diễn dịch).

### 2. Hook đọc `useAuth()` trực tiếp; bỏ prop drilling cho permission
Component cần gating gọi thẳng `usePermissions()` thay vì nhận prop `isAdmin`.

- `Navbar` hiện nhận `isAdmin` từ `App`. Đổi `Navbar` tự `usePermissions()`, bỏ prop `isAdmin` ở chỗ `App` render `Navbar`.
- **Lưu ý:** `ClassModal` prop `isAdmin` KHÔNG đổi — nó là prop ngữ cảnh (AdminPanel truyền `true` cứng), không phải quyền của caller hiện tại.
- **Alternative:** giữ prop drilling → lệch mục tiêu "một nguồn", vẫn phải truyền nhiều tầng.

### 3. Một file `src/hooks/usePermissions.js`, không context riêng
Không cần Provider mới — `useAuth()` đã cung cấp `teacher` toàn app. Hook chỉ là lớp suy diễn mỏng phía trên.

```js
import { useAuth } from '@/hooks/useAuth'
export function usePermissions() {
  const { teacher } = useAuth()
  const isAdmin = !!teacher?.is_admin
  return {
    isAdmin,
    canViewFees: isAdmin,
    canAccessAdmin: isAdmin,
    canManageCenterSettings: isAdmin,
    canManageStudents: isAdmin,
    canCreateMockTest: isAdmin,
    canManageClasses: isAdmin,
    canFilterByTeacher: isAdmin,
  }
}
```

### 4. Refactor không đổi hành vi — kiểm chứng bằng so sánh trước/sau
Mỗi điểm migrate phải cho ra cùng kết quả boolean. `!!teacher?.is_admin` và `teacher?.is_admin === true` tương đương cho giá trị boolean/undefined → an toàn khi thống nhất về `!!`.

## Risks / Trade-offs

- **[Bỏ sót một biến thể, lệch hành vi]** → Mitigation: refactor từng file, đối chiếu cờ cũ ↔ cờ mới; chạy app kiểm tra admin và teacher.
- **[Nhầm migrate chỗ không phải permission caller]** (vd `t.is_admin` của giáo viên khác, `classService.setAdmin`) → Mitigation: design đã liệt kê rõ danh sách giữ nguyên; không động vào.
- **[Over-engineering cho app 2 vai trò]** → Chấp nhận: chi phí một file mỏng, đổi lại dễ audit + dễ thêm rule (đang có change `restrict-teacher-readonly-students` cần nhiều cờ).
- **[Trùng việc với change restrict-teacher-readonly-students]** → Điều phối: nếu change đó apply trước, change này refactor luôn các prop `isAdmin` mới thêm; nếu ngược lại, change kia tiêu thụ `canManageStudents`/`canCreateMockTest` trực tiếp.

## Migration Plan

1. Tạo `src/hooks/usePermissions.js` với các cờ ngữ nghĩa.
2. Refactor lần lượt: `Navbar` (bỏ prop, dùng hook) → `App.jsx` (route guard) → `AdminPanelPage` (guard) → `SettingsPage` → `SchedulePage` → `ClassesOverviewPage`.
3. Chạy app, kiểm tra với cả tài khoản admin và teacher: menu, route guard, các section/nút khớp hành vi cũ.
4. Cập nhật `CLAUDE.md`: quy ước check quyền UI qua `usePermissions()`.
5. **Rollback:** xóa hook, hoàn nguyên các file về đọc `teacher?.is_admin` trực tiếp (refactor thuần, không có thay đổi DB nên rollback an toàn).
