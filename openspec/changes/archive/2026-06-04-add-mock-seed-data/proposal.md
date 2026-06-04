## Why

Hiện chưa có bộ dữ liệu mẫu nào để kiểm thử đầy đủ các tính năng của app (Dashboard, Fees, Reports, Reviews, Schedule, Classes, MockTest, Students Directory, Admin Panel). Việc nhập tay từng record qua UI vừa chậm vừa không bao phủ được các biến thể (trạng thái enrollment, fee_type, progress bài tập, paid/unpaid học phí, absent review...). Cần một file SQL seed chạy một lần trong Supabase SQL Editor để dựng dữ liệu thực tế, đúng type backend, bao phủ mọi code path.

## What Changes

- Thêm file `supabase/seed/seed_mock_data.sql` — script seed dữ liệu mock chạy trong Supabase SQL Editor (bypass RLS vì chạy với quyền owner).
- **Anchor vào 3 giáo viên có sẵn** (2 teacher + 1 admin) trong `auth.users`/`teachers` — resolve `teacher_id` qua placeholder email `<<TEACHER_1_EMAIL>>`, `<<TEACHER_2_EMAIL>>`, `<<TEACHER_ADMIN_EMAIL>>` (người chạy tự điền). **Không** tạo/đụng `auth.users`.
- Dùng **literal UUID pre-generated** cho mọi mock row để FK khớp nhau và file re-run được (deterministic).
- **Dynamic date** theo `current_date` (quá khứ / hôm nay / tương lai) để các tính năng "hôm nay" / "tháng này" luôn sáng.
- **Idempotent**: bước cleanup xóa dữ liệu mock cũ (scope theo teacher_id mock) trước khi insert, cho phép chạy lại nhiều lần.
- Bao phủ 15 nhóm bảng với **variety matrix**: đủ biến thể status/fee_type/progress/method/paid/absent + lớp IELTS mặc định và lớp custom skill_config.
- Bước **verification** cuối file: `SELECT count(*)` mỗi bảng để xác nhận.
- Không thay đổi schema, service layer, hay UI — chỉ đọc schema hiện có.

## Capabilities

### New Capabilities
- `mock-seed-data`: Bộ dữ liệu mock SQL bao phủ toàn bộ tính năng app, đúng type backend, UUID hợp lệ, anchor vào giáo viên có sẵn, re-run an toàn.

### Modified Capabilities
<!-- Không có capability hiện hành nào thay đổi requirement. -->

## Impact

- **Thêm mới**: `supabase/seed/seed_mock_data.sql` (và README ngắn nếu cần hướng dẫn điền placeholder + thứ tự chạy).
- **Không đổi**: migrations, `src/services/*`, UI components — seed chỉ phụ thuộc schema hiện tại.
- **Phụ thuộc**: cần 3 email giáo viên có sẵn để điền placeholder trước khi chạy; chạy trong Supabase SQL Editor (quyền owner, bypass RLS).
- **Rủi ro**: nếu schema đổi sau này (thêm cột NOT NULL, đổi CHECK constraint, đổi shape jsonb) thì seed phải cập nhật theo — ghi chú trong design.
