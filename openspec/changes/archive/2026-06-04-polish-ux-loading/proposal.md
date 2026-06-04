## Why

Một số trang còn dùng text "Đang tải..." thay vì `<Skeleton>` khiến trải nghiệm tải không nhất quán với phần còn lại của app. `ClassDetailPage` thiếu breadcrumb/back rõ ràng khi vào từ Dashboard. Tab nhận xét chung trên `ReviewsPage` ít dùng và làm rối UI. Đây là nhóm polish UI thuần, không động đến data model — gom lại để ship nhanh, rủi ro thấp.

## What Changes

- **A1** `FeesPage`: thay loading text bằng `<Skeleton>` đồng nhất (header + bảng).
- **A2** `ReviewsPage`: thêm `<Skeleton>` cho tất cả panel (radar, lịch sử, điểm danh %, bài tập %) khi load dữ liệu.
- **A3** `ClassDetailPage → MockTestTab`: thêm `<Skeleton>` khi load mock test (sidebar + nội dung).
- **E1** `ClassDetailPage`: breadcrumb/back rõ ràng ("← Lớp học" hoặc breadcrumb "Lớp học / Tên lớp") khi vào từ Dashboard hay Schedule.
- **C4** `ReviewsPage`: bỏ tab/panel nhận xét chung (xóa `<GeneralCommentPanel />` khỏi UI). Service `generalCommentService` giữ nguyên (không xóa backend).

## Capabilities

### Modified Capabilities
- `pages`: Hành vi tải của `FeesPage`, `ReviewsPage`, `MockTestTab` dùng skeleton; điều hướng trở lại của `ClassDetailPage` rõ ràng; `ReviewsPage` không còn panel nhận xét chung.

## Impact

- **UI:** `src/pages/FeesPage.jsx`, `src/pages/ReviewsPage.jsx`, `src/pages/ClassDetailPage/index.jsx`, `src/pages/ClassDetailPage/tabs/MockTestTab.jsx`.
- **Component:** dùng `<Skeleton>` từ `@/components/ui`; gỡ import/usage `GeneralCommentPanel` (giữ file component và service, chỉ bỏ render).
- **Không ảnh hưởng:** data model, service layer, routing state, DB.
