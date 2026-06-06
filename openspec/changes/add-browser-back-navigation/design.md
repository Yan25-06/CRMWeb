## Context

`App.jsx` quản lý điều hướng bằng state nội bộ, không có react-router (quyết định kiến trúc đã chốt — xem CLAUDE.md). Có **hai tầng** điều hướng:

1. **Tầng trang** — `page` (`dashboard`, `classes`, `students`, `fees`, ...).
2. **Tầng chi tiết lớp** — trong `page === 'classes'`, `selectedClassId` quyết định hiển thị `ClassesOverviewPage` (list) hay `ClassDetailPage` (detail).

Cả hai tầng đều thay đổi qua các callback (`handleNavigate`, `setSelectedClassId`, `onAttendance`, `onNavigateToClass`, `onBack`). Vì không entry nào được đẩy vào browser history, nút Back của trình duyệt thoát thẳng khỏi web.

`selectedClassId` còn được persist vào `localStorage` (để giữ lớp đang chọn qua F5). `classInitialTab` là state phụ quyết định tab mở sẵn của `ClassDetailPage`.

## Goals / Non-Goals

**Goals:**
- Nút Back/Forward của browser điều hướng đúng trong phạm vi app thay vì thoát web.
- Không thêm dependency, không đổi URL path, không phá kiến trúc static deploy GitHub Pages.
- Một điểm đồng bộ history duy nhất để tránh rải `pushState` khắp nơi.
- Khôi phục đúng `page` + `selectedClassId` khi back/forward.

**Non-Goals:**
- Không migrate sang react-router / HashRouter.
- Không tạo URL path có ý nghĩa (`/classes/:id`), không bookmark/deep-link.
- Không khôi phục hoàn hảo `classInitialTab` (chấp nhận fallback về tab mặc định khi back).
- Không đồng bộ `month`/`year` picker vào history.

## Decisions

### Quyết định 1: History API thuần thay vì react-router
Dùng `window.history.pushState(state, '')` + listener `popstate`. **Lý do:** giải đúng vấn đề (back button) với chi phí thấp nhất, không refactor toàn bộ callback tree, không rủi ro deploy. Alternative (HashRouter) giải nhiều hơn nhu cầu thực tế của web nội bộ và đụng nhiều component hơn.

### Quyết định 2: Lưu `{ page, selectedClassId }` trong history state
Mỗi navigation đẩy một entry với `state = { page, selectedClassId }`. Khi `popstate` bắn ra, đọc `event.state` và gọi `setPage` + `setSelectedClassId` để khôi phục. **Lý do:** đây là cặp state tối thiểu đủ tái dựng màn hình. `classInitialTab` cố tình loại khỏi state (xem Risks).

### Quyết định 3: Một hàm sync trung tâm `pushNavState`
Gom logic đẩy history vào một chỗ. Mọi thay đổi điều hướng (chuyển trang qua `handleNavigate`, mở chi tiết lớp qua `onAttendance`/`onNavigateToClass`/`onSelectClass`, quay về list qua `onBack`) gọi qua hàm này. **Lý do:** tránh quên `pushState` ở một nhánh, giữ một nguồn chân lý cho việc đồng bộ.

### Quyết định 4: Thay thế entry đầu tiên bằng `replaceState`
Khi app mount, dùng `replaceState` để gắn state hiện tại (`dashboard` hoặc lớp đang persist trong localStorage) vào entry hiện hành — tránh tình trạng `popstate` đầu tiên có `event.state === null`. Khi `event.state` null thì fallback về `dashboard`.

### Quyết định 5: Phân biệt cập nhật từ user vs từ popstate
Khi khôi phục state do `popstate`, **không** được đẩy thêm entry mới (sẽ tạo vòng lặp). Dùng một cờ (ref) để `pushNavState` bỏ qua khi đang xử lý popstate, hoặc cập nhật state trực tiếp không qua hàm push.

## Risks / Trade-offs

- **`classInitialTab` không khôi phục chính xác** → Khi back về `ClassDetailPage`, tab sẽ về mặc định (`students`) thay vì tab đang xem trước đó. Chấp nhận được; nếu cần sau này có thể thêm `classInitialTab` vào history state.
- **Đồng bộ với `localStorage` của `selectedClassId`** → khi khôi phục qua popstate phải set `selectedClassId`, effect persist localStorage sẽ chạy theo. Cần đảm bảo set `null` đúng lúc back về list để localStorage không giữ lớp cũ. Mitigation: dùng chung setter hiện có, effect persist đã xử lý cả nhánh null.
- **Guard route admin/fees** → khi back tới một entry là `fees`/`admin` mà user không còn quyền (hiếm, vì quyền không đổi trong session) → tái dùng logic `currentPage` guard hiện có, không cần xử lý thêm.
- **Double-entry khi mở chi tiết lớp** → chuyển `page` sang `classes` rồi set `selectedClassId` là hai bước; phải gộp thành **một** `pushState` để một lần Back đưa thẳng về nơi xuất phát (vd Dashboard), không kẹt ở list rỗng. Mitigation: `pushNavState` nhận cả `page` và `selectedClassId` cùng lúc.
