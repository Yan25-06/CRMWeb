## Why

App dùng routing bằng state nội bộ (`useState('page')` trong `App.jsx`), không tích hợp với browser history. Khi user bấm nút **Back** của trình duyệt, browser thoát thẳng khỏi web (về trang trước trong Chrome) thay vì quay lại màn hình trước trong app. Đây là điểm đau UX thực tế của giáo viên khi điều hướng giữa Dashboard → Classes → ClassDetail.

## What Changes

- Đồng bộ trạng thái điều hướng (`page` + `selectedClassId`) vào **browser history** qua History API (`pushState` / `popstate`).
- Khi user chuyển trang hoặc mở chi tiết lớp → đẩy một entry vào history stack.
- Khi user bấm **Back / Forward** của browser → khôi phục đúng màn hình trước đó trong app (thay vì thoát web).
- **Không** thêm thư viện routing (react-router) và **không** thay đổi URL path — đây là giải pháp tối thiểu, giữ nguyên kiến trúc static web deploy trên GitHub Pages.
- Giữ nguyên toàn bộ nút điều hướng trong UI hiện có (`onNavigate`, `onBack`, `onAttendance`, `onNavigateToClass`) — chỉ bổ sung lớp đồng bộ history bên dưới.

## Capabilities

### New Capabilities
- `browser-navigation`: Đồng bộ trạng thái điều hướng nội bộ của app với browser history để nút Back/Forward hoạt động đúng trong phạm vi app.

### Modified Capabilities
<!-- Không có spec capability hiện hành nào thay đổi requirement; đây là hành vi điều hướng mới hoàn toàn. -->

## Impact

- **Code:** chủ yếu `src/App.jsx` (thêm sync history vào `handleNavigate`, vào việc set `selectedClassId`, và thêm listener `popstate`). Các callback truyền xuống component con (`onAttendance`, `onNavigateToClass`, `onBack`, `onSelectClass`) cần đi qua một điểm sync chung.
- **Dependencies:** không thêm dependency mới.
- **Deploy:** không ảnh hưởng — vẫn là static build trên GitHub Pages (`base: '/RollCallWeb/'`), không cần trick 404, không đổi URL.
- **Rủi ro nhỏ:** `classInitialTab` có thể không khôi phục chính xác tab khi back về ClassDetail (edge case chấp nhận được, ghi rõ trong design).
