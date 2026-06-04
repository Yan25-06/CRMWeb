## Context

Các trang khác (vd `StudentsDirectoryPage`, `ClassDetailPage` header) đã dùng `<Skeleton>` từ `@/components/ui`. `FeesPage`, `ReviewsPage`, `MockTestTab` còn dùng text loading. `ClassDetailPage` có nút back về list lớp nhưng khi vào từ Dashboard/Schedule, ngữ cảnh "từ đâu tới" không rõ. `ReviewsPage` hiện render `GeneralCommentPanel` như một panel/tab.

## Goals / Non-Goals

**Goals:**
- Thống nhất loading state bằng `<Skeleton>` ở 3 chỗ còn thiếu.
- Điều hướng trở lại của `ClassDetailPage` rõ ràng, hoạt động cho mọi nguồn vào.
- Gỡ panel nhận xét chung khỏi `ReviewsPage`.

**Non-Goals:**
- Không đổi data model, không xóa `generalCommentService` hay file `GeneralCommentPanel.jsx`.
- Không thiết kế lại layout các trang, chỉ thay trạng thái tải + back.

## Decisions

### 1. Skeleton thay text loading
Tái dùng `<Skeleton>` hiện có. Mỗi trang render khung skeleton xấp xỉ layout thật (số dòng bảng, số panel) trong khi `loading === true`, rồi swap sang nội dung. Không tạo component skeleton mới trừ khi cần biến thể.

### 2. Breadcrumb/back của ClassDetailPage
`ClassDetailPage` đã có nút back về list. Bổ sung breadcrumb tĩnh "Lớp học / {tên lớp}" ở header, phần "Lớp học" click được để về list (set `page='classes'`, clear `selectedClassId`). Vì routing là state trong `App.jsx` và `selectedClassId` persist localStorage, back chỉ cần điều hướng về `classes` list — không phụ thuộc nguồn vào nên hoạt động cho cả Dashboard/Schedule.

### 3. Bỏ GeneralCommentPanel — chỉ gỡ render
Xóa import và chỗ render `<GeneralCommentPanel />` trong `ReviewsPage`. Giữ nguyên file component + `generalCommentService` để có thể khôi phục, tránh breaking ngoài scope.

## Risks / Trade-offs

- **Skeleton lệch layout thật** → giữ khung gần đúng số dòng/panel để tránh giật layout (CLS).
- **Bỏ panel nhận xét chung làm mất chỗ nhập** → dữ liệu cũ vẫn còn trong DB; nếu cần khôi phục chỉ việc render lại. Chấp nhận theo yêu cầu.

## Migration Plan

1. Thay loading text → skeleton ở `FeesPage`, `ReviewsPage`, `MockTestTab`.
2. Thêm breadcrumb/back ở `ClassDetailPage` header.
3. Gỡ render `GeneralCommentPanel` khỏi `ReviewsPage`.
4. Rollback: revert các thay đổi UI; không có thay đổi DB/data cần hoàn tác.
