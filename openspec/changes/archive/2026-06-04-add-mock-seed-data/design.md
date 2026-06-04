## Context

App (`rollcall-manager`) dùng Supabase Postgres với 19 bảng, RLS bật trên tất cả. `teachers.id` là FK tới `auth.users(id)` — không thể bịa. Hiện đã có sẵn **3 row teacher** (2 giáo viên + 1 admin) trong `auth.users`/`teachers`. Mọi bảng khác có `id uuid default gen_random_uuid()` và phụ thuộc nhau qua FK `on delete cascade` (trừ `payments.class_id` là `set null`).

Mục tiêu là dựng một dataset mock đủ để test mọi tính năng mà không nhập tay qua UI. Người chạy sẽ dán file SQL vào Supabase SQL Editor (chạy với quyền owner → **bypass RLS**), nên không cần lo `auth.uid()`.

Ràng buộc đã chốt với user:
- Đường giao: **SQL seed file** (không phải JS/in-app).
- Anchor: **3 teacher có sẵn**, resolve qua **placeholder email** người chạy tự điền.
- 1 change duy nhất cho toàn bộ.

## Goals / Non-Goals

**Goals:**
- Một file `supabase/seed/seed_mock_data.sql` chạy top-to-bottom, không lỗi, trong SQL Editor.
- UUID hợp lệ cho mọi row; mọi cột đúng type (date/time/timestamptz/smallint/integer/numeric/text[]/jsonb/boolean) và tôn trọng mọi CHECK + UNIQUE constraint.
- Bao phủ variety đủ để mọi màn hình + filter + drill-down + export có dữ liệu ý nghĩa.
- Re-run an toàn (idempotent) — chạy lại không nhân đôi, không vỡ FK.
- Date động theo `current_date` để "hôm nay"/"tháng này" luôn có dữ liệu.

**Non-Goals:**
- Không tạo/sửa `auth.users` (dùng teacher có sẵn).
- Không đổi schema, migration, service layer, UI.
- Không seed qua app/anon key (không đi qua RLS path).
- Không nhằm mô phỏng dữ liệu khối lượng lớn (performance test) — chỉ đủ variety.

## Decisions

### D1. Literal pre-generated UUID cho mọi mock row (thay vì `gen_random_uuid()` inline)
**Vì:** child row phải tham chiếu đúng `id` của parent. `gen_random_uuid()` inline tạo giá trị mới mỗi lần gọi → không thể reuse qua nhiều câu INSERT. Literal UUID cho phép: (a) FK khớp tường minh, (b) re-run deterministic, (c) cleanup chính xác theo id.
**Quy ước:** đặt UUID dễ đọc khi debug, ví dụ prefix theo bảng — `00000000-0000-0000-000s-0000000000NN` (students), `...000c...` (classes)... Miễn là UUID hợp lệ và duy nhất. (Có thể dùng pattern `aaaaaaaa-...` cho teacher A, v.v.)
**Thay thế đã cân nhắc:** DO block với biến `gen_random_uuid()` — linh hoạt nhưng verbose, khó idempotent, khó đọc khi review.

### D2. Resolve teacher_id qua placeholder email, không hardcode UUID teacher
**Vì:** UUID teacher nằm trong `auth.users`, khác nhau giữa môi trường. Dùng placeholder `<<TEACHER_1_EMAIL>>` để người chạy điền, rồi resolve trong một CTE/DO block:
```sql
-- ví dụ: lấy id theo email vào psql variable hoặc CTE
select id from public.teachers where email = '<<TEACHER_1_EMAIL>>';
```
**Cơ chế:** dùng một `DO $$ DECLARE ... $$` block hoặc CTE đầu file gán 3 biến teacher id. Nếu email không khớp → raise exception rõ ràng (fail-fast, tránh insert mồ côi).
**Thay thế:** bắt người dùng dán thẳng UUID — dễ sai, không thân thiện.

### D3. Idempotent qua cleanup theo teacher scope ở đầu file
**Vì:** cho phép chạy lại. Trước khi insert, `DELETE` dữ liệu thuộc 3 teacher mock theo thứ tự child→parent (hoặc dựa vào `on delete cascade` từ students/classes). Vì literal UUID cố định, cũng có thể `DELETE WHERE id IN (literal...)`.
**Lưu ý:** KHÔNG xóa row `teachers`/`auth.users` (chỉ xóa data con). `settings` cũng cleanup theo teacher_id.
**Thay thế:** `ON CONFLICT DO NOTHING` — không đủ vì không dọn row thừa khi đổi dataset.

### D4. Date động theo current_date
**Vì:** tính năng Dashboard "Lịch hôm nay", stat "chưa đóng phí", Reports theo tháng phụ thuộc thời điểm. Dùng `current_date`, `current_date - n`, `date_trunc('month', current_date)`, `extract(year/month from current_date)` cho fees.year/month (smallint). Tránh date cứng sẽ "hết hạn".
**time:** literal `'HH:MM:SS'`. **timestamptz:** `now()`.

### D5. jsonb shapes bám đúng service layer
- `classes.skill_config`: array `[{"name","maxScore","order"}]`. Lớp IELTS dùng default 4 kỹ năng 0–9; tạo thêm lớp custom (ví dụ TOEIC: Listening/Reading thang khác) để test skill_config động.
- `reviews.scores`: object keyed theo **tên kỹ năng của lớp đó** — phải khớp `skill_config`, nếu không Radar/Review render sai.
- `mock_tests.sections`: array shape như skill_config; `mock_test_results.scores`: object keyed theo section name; `total_score` numeric riêng.

### D6. Variety matrix (đảm bảo coverage)
Mỗi enum/biến thể phải xuất hiện ≥1 lần: enrollment status (active/paused/dropped), fee_type (monthly/course), homework progress (not_done/in_progress/done), payment method (cash/transfer), fees.paid (true/false), review.absent (true/false), student có/không email, student không thuộc lớp nào, lớp IELTS default + lớp custom skill_config, session quá khứ/hôm nay/tương lai. Mock test ≥2 mốc tháng để Reports vẽ trend.

## Risks / Trade-offs

- **[Schema drift]** Nếu sau này thêm cột NOT NULL / đổi CHECK / đổi shape jsonb → seed lỗi hoặc lệch. → Mitigation: ghi chú "đồng bộ khi đổi schema" ở đầu file + trong CLAUDE.md; verification block cuối giúp phát hiện sớm.
- **[Quên điền placeholder]** Chạy khi email còn `<<...>>` → resolve teacher fail. → Mitigation: DO block raise exception rõ ràng nếu không tìm thấy teacher theo email.
- **[Chạy nhầm trên DB production có dữ liệu thật]** Cleanup chỉ scope theo teacher mock + literal UUID mock, không đụng teacher khác; nhưng nếu teacher mock trùng teacher thật thì xóa nhầm. → Mitigation: cảnh báo rõ trong header file rằng 3 email phải là tài khoản test; cleanup chỉ xóa các literal-UUID mock + data của teacher đó được tạo bởi seed.
- **[RLS]** File phải chạy trong SQL Editor (owner), không qua app. → Mitigation: nêu rõ trong README/header.
- **[UNIQUE constraint]** Trùng (student_id,class_id), (session_id,student_id), (student_id,year,month)... → Mitigation: thiết kế dataset tránh trùng + cleanup trước.

## Migration Plan

1. Tạo `supabase/seed/seed_mock_data.sql` theo 15 nhóm (xem tasks.md).
2. Người chạy điền 3 email vào placeholder.
3. Dán vào Supabase SQL Editor → Run.
4. Đọc kết quả verification (`SELECT count(*)`).
5. Mở app bằng tài khoản teacher mock → kiểm tra từng màn hình.

**Rollback:** chạy lại đoạn cleanup ở đầu file (xóa toàn bộ data mock theo teacher/literal-UUID) là đủ; không có thay đổi schema nên không cần migration down.

## Open Questions

- Có cần file README riêng trong `supabase/seed/` hay nhúng hướng dẫn vào comment header của SQL là đủ? (Mặc định: nhúng vào header; thêm README nếu user muốn.)
