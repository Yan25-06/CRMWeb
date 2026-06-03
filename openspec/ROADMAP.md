# Lộ trình Supabase Multi-Teacher

Change gộc cũ: `add-supabase-multi-teacher` (giữ làm tham chiếu, xóa sau khi lộ trình hoàn tất)

## Thứ tự thực hiện

| # | Change name | Capability | Phụ thuộc |
|---|-------------|-----------|-----------|
| 1 | `add-supabase-schema` | backend-data (schema) | — |
| 2 | `add-auth-login` | authentication | 1 |
| 3 | `add-rls-policies` | authorization | 1, 2 |
| 4 | `add-service-students-classes` | backend-data (service layer) | 1, 3 |
| 5 | `add-service-sessions-attendance` | backend-data (service layer) | 1, 3 |
| 6 | `add-service-homework` | backend-data (service layer) | 1, 3 |
| 7 | `add-service-fees` | backend-data (service layer) | 1, 3 |
| 8 | `add-service-reviews` | backend-data (service layer) | 1, 3 |
| 9 | `add-service-tests-settings` | backend-data + data (MODIFIED) | 1, 3 |
| 9a | `add-service-reports` | backend-data + pages (MODIFIED) | 1, 3, 9 |
| 10 | `add-admin-panel` | admin-panel | 2, 9a |

## Ghi chú quan trọng

**Thứ tự cố định:**
- #2 (auth) phải trước #3 (RLS) — cần session thật để test phân tách dữ liệu
- #4–#9 là service layer chính, chạy song song sau khi #3 xong
- #9 (add-service-tests-settings) thêm `mockTestService`, `mockTestResultService`, `settingsService` (không xóa db.js ở giai đoạn này)
- #9a (add-service-reports) **phải sau #9** vì cần `mockTestService` để migrate card Mock Test của `ReportsPage`. Sau #9a hoàn thành, mới sang phase xóa `db.js` trong #9 (task 6.x của #9 sẽ xóa db.js)
- #10 (Admin Panel) là change cuối, cần đủ #2 + #9a

**Scope từng nhóm service layer (#4–#9a):**
- #4: `students`, `classes`, `enrollments`
- #5: `sessions`, `attendance`, `schedule` + optimistic update điểm danh
- #6: `homeworks`, `hw_assignments`, `submissions`
- #7: `fees`, `payments`
- #8: `reviews`, `session_reviews`, `general_comments`
- #9: `mock_tests`, `mock_test_results`, `settings` + banner mất mạng + retry (KHÔNG xóa db.js ở giai đoạn này)
- #9a: Migrate trang `ReportsPage` (3 card) sang service layer async, giữ nguyên hành vi nghiệp vụ
- Sau #9a xong, #9 sẽ **xóa `src/store/db.js`** (task 6 của change #9) vì khi đó không còn code nào dùng db.js

**Quyết định kiến trúc đã chốt:**
- RLS enforce ở PostgreSQL, không filter ở frontend
- Admin read-only = không cấp policy ghi cho admin ở DB
- Service layer `src/services/` — UI không gọi `supabase.*` trực tiếp
- Invite giáo viên qua **Supabase Dashboard** (Auth → Invite user); database trigger tự tạo row `teachers` khi user xác nhận — không dùng Edge Function
- Optimistic UI + retry (không offline-first thật)
- Không migrate dữ liệu localStorage cũ — bắt đầu sạch

**Open questions chưa chốt:**
- Cron giữ Supabase project khỏi pause (→ gắn vào #11 nếu cần)
- Reset mật khẩu giáo viên: dùng "Quên mật khẩu" tự làm hoặc admin invite lại qua Dashboard
- `supabase db push` qua CLI hay paste SQL vào Dashboard? (→ #1)
- Enum/lookup: text + CHECK constraint hay PostgreSQL type riêng? (đề xuất: text + CHECK)
