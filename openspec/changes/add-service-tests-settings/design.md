## Context

Change cutover, sau #4–#8 đã chuyển mọi entity khác sang Supabase. Còn lại `mock_tests` (cột `sections jsonb`), `mock_test_results` (`scores jsonb`, `total_score`), `settings` (theo `teacher_id`). Khi ba entity này lên service layer, `src/store/db.js` (~1100 dòng localStorage) không còn ai dùng. Đây cũng là lúc bổ sung banner mất kết nối + retry — phần trải nghiệm online bị hoãn từ #5. `App.jsx` và `SettingsPage` hiện còn gọi `seedDemoData`/`exportData`/`importData` từ db.js.

## Goals / Non-Goals

**Goals:**
- Service async cho mock-test/settings theo cùng quy ước #4–#8.
- Banner mất kết nối toàn cục + retry thao tác ghi khi mạng phục hồi.
- Xóa sạch `db.js` + logic localStorage, không còn import nào sót.

**Non-Goals:**
- Offline-first thật (sync queue bền vững, conflict resolution) — chỉ retry trong phiên.
- Admin Panel (#10).
- Migrate dữ liệu localStorage cũ — bắt đầu sạch.

## Decisions

**1. Ba file service, cùng quy ước các change trước.**
`mockTestService`, `mockTestResultService`, `settingsService` export hàm async bọc `supabase.from(...)`, ném `Error` khi lỗi. `settingsService.upsert` gán `teacher_id = auth.uid()`.

**2. Cột `jsonb` ánh xạ trực tiếp object/array JS.**
`supabase-js` trả `jsonb` thành object/array JS và nhận object/array khi ghi. Bỏ mọi `JSON.parse`/`stringify` thủ công cho `sections`/`scores` khi chuyển component.

**3. Banner offline qua hook `useOnlineStatus` + component `OfflineBanner` đặt ở App.**
Nghe `navigator.onLine` + sự kiện `online`/`offline`. Banner hiển thị khi offline. Đặt ở `App.jsx` để phủ toàn ứng dụng.

**4. Retry ghi: hàng đợi trong bộ nhớ phiên, không bền vững.**
Thao tác ghi thất bại vì mất mạng được đẩy vào hàng đợi in-memory; khi sự kiện `online` bắn, thử lại theo thứ tự. Không persist qua reload (chấp nhận theo non-goal offline-first). Đủ cho 5 user mạng chập chờn.

**5. Xóa db.js làm bước cuối, sau khi quét sạch import.**
Trước khi xóa: `grep` toàn repo các import `store/db` và `mockTestExport`. Thay `seedDemoData` (bỏ — backend bắt đầu sạch), `exportData`/`importData` (bỏ tính năng backup localStorage hoặc thay bằng export đọc từ service nếu cần). Chỉ xóa file khi build sạch.

**6. Export/Import localStorage backup bị loại bỏ.**
Tính năng backup JSON dựa toàn bộ localStorage không còn ý nghĩa khi nguồn dữ liệu là Supabase (đã có backup phía DB). Gỡ nút export/import ở `SettingsPage`; nếu người dùng vẫn muốn export, để lại như mục tương lai ngoài phạm vi.

## Risks / Trade-offs

- **Big-bang xóa db.js** — sót một import là vỡ build. Mitigation: quét toàn repo + chạy build/typecheck trước khi xóa; xóa là commit riêng dễ revert.
- **Retry in-memory mất khi reload** — nếu user đóng tab lúc offline, thao tác chờ mất. Chấp nhận theo non-goal; dữ liệu đang nhập vẫn còn trên form tới khi gửi thành công.
- **`jsonb` cấu trúc sai** — nếu component cũ giả định chuỗi, đọc/ghi lệch. Mitigation: rà các chỗ dùng `sections`/`scores`.
- **Mất `seedDemoData`** — môi trường mới không có dữ liệu mẫu. Chấp nhận; có thể seed thủ công qua Dashboard nếu cần demo.
