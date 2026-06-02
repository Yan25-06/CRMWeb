## Why

Tiếp nối #4–#6, nhóm học phí — `fees` (trạng thái học phí theo học sinh/tháng) và `payments` (lịch sử thanh toán) — cần chuyển sang service layer để rời localStorage. Học phí tham chiếu `student_id`/`class_id` nên đi sau #4.

## What Changes

- Thêm `feeService` và `paymentService` async trả Promise, bọc `supabase.from(...)`.
- `feeService`: đọc theo học sinh/tháng, upsert trạng thái học phí theo `(student_id, year, month)`, tính học phí (`calcFee`) và kiểm tra đã đóng (`isFeePaid`) dựa trên dữ liệu đã nạp.
- `paymentService`: đọc theo học sinh/kỳ, tính tổng đã đóng theo kỳ, tạo và xóa thanh toán.
- Chuyển component tiêu thụ sang async: `FeesPage`, `FeesTable`, `PaymentModal`, `StudentPaymentHistoryPanel`.
- Gỡ import `fees`/`payments` từ `db.js` ở component đã chuyển; **không** xóa `db.js`.

Phạm vi: **chỉ** fees/payments. KHÔNG gồm: reviews (#8), mock-test/settings + xóa `db.js` (#9), banner offline toàn cục.

## Capabilities

### New Capabilities
- `backend-data`: Service layer async cho `fees`, `payments`; upsert học phí idempotent theo `(student_id, year, month)`; tính học phí và tổng thanh toán; UI không gọi `supabase.*` trực tiếp.

### Modified Capabilities
<!-- Không có. -->

## Impact

- **Code mới**: `src/services/feeService.js`, `paymentService.js`.
- **Code sửa**: `FeesPage`, `FeesTable`, `PaymentModal`, `StudentPaymentHistoryPanel` sang async (loading/error).
- **Phụ thuộc**: cần #1 (schema), #3 (RLS), #4 (học sinh/lớp mà fees/payments tham chiếu).
- **Rủi ro**: thấp — chủ yếu CRUD + tính toán tiền; cần đảm bảo upsert đúng khóa `(student_id, year, month)` và tính tiền nhất quán với logic cũ.
