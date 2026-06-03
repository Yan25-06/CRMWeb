## Why

Đây là change **cutover** — nhóm service layer cuối. Sau khi #4–#8 đã chuyển students/classes/sessions/attendance/homework/fees/reviews sang Supabase, còn lại `mock_tests`, `mock_test_results`, `settings`. Khi ba entity này lên service layer thì `src/store/db.js` không còn ai dùng → xóa db.js và toàn bộ logic localStorage, đồng thời bổ sung banner mất kết nối + retry để hoàn thiện trải nghiệm online.

## What Changes

- Thêm `mockTestService`, `mockTestResultService`, `settingsService` async trả Promise, bọc `supabase.from(...)`.
- `mockTestService`: đọc theo lớp, tạo/sửa/xóa bài thi thử (cột `sections jsonb`).
- `mockTestResultService`: đọc theo bài thi/học sinh, upsert kết quả theo `(mock_test_id, student_id)` (cột `scores jsonb`, `total_score`).
- `settingsService`: đọc/ upsert cài đặt theo `(teacher_id)`.
- Thêm **banner mất kết nối** toàn cục + cơ chế **retry** cho thao tác ghi khi mạng phục hồi.
- Chuyển component tiêu thụ sang async: `MockTestTab`, `MockTestModal`, `MockTestScoreTable`, `StudentTestProfile`, `SettingsPage`, phần cài đặt của `Navbar`.
- **BREAKING**: Xóa `src/store/db.js` và `src/store/mockTestExport.js` (logic localStorage); thay export/import backup localStorage và `seedDemoData` (không còn ý nghĩa với backend Supabase).
- Gỡ mọi import còn lại từ `db.js` trên toàn bộ codebase.

Phạm vi: mock-test/settings + banner offline + retry + **xóa db.js**. KHÔNG gồm: Admin Panel (#10).

## Capabilities

### New Capabilities
- `backend-data`: Service layer async cho `mock_tests`, `mock_test_results`, `settings`; xử lý cột `jsonb` (`sections`, `scores`); banner mất kết nối + retry khi ghi; UI không gọi `supabase.*` trực tiếp.

### Modified Capabilities
- `data`: Tầng dữ liệu localStorage (`src/store/db.js`, các key `phf_*`) bị thay thế hoàn toàn bằng Supabase qua service layer; không còn là nguồn dữ liệu chính.

## Impact

- **Code mới**: `src/services/mockTestService.js`, `mockTestResultService.js`, `settingsService.js`; component/hook banner offline + retry (vd `useOnlineStatus`, `OfflineBanner`).
- **Code xóa**: `src/store/db.js`, `src/store/mockTestExport.js`, các luồng `exportData`/`importData`/`seedDemoData` dựa localStorage.
- **Code sửa**: `MockTestTab`, `MockTestModal`, `MockTestScoreTable`, `StudentTestProfile`, `SettingsPage`, `Navbar`, `App.jsx` (bỏ `seedDemoData`).
- **Phụ thuộc**: cần #1 (schema), #3 (RLS), và #4–#8 (mọi entity khác đã rời db.js) — bắt buộc làm cuối nhóm service layer.
- **Rủi ro**: cao nhất nhóm — xóa db.js là big-bang; nếu sót import sẽ vỡ build. Cần quét toàn repo trước khi xóa.
