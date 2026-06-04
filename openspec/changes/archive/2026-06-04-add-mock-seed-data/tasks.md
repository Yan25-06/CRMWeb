## 1. Khung file & cấu hình anchor

- [x] 1.1 Tạo `supabase/seed/seed_mock_data.sql` với comment header: mục đích, cảnh báo "chạy trong SQL Editor / 3 email phải là tài khoản test / điền placeholder trước khi chạy", và ghi chú "đồng bộ khi đổi schema"
- [x] 1.2 Khai báo 3 placeholder email `<<TEACHER_1_EMAIL>>`, `<<TEACHER_2_EMAIL>>`, `<<TEACHER_ADMIN_EMAIL>>`
- [x] 1.3 Resolve teacher_id từ email (DO block hoặc CTE), fail-fast raise exception nếu email không khớp giáo viên nào
- [x] 1.4 Định nghĩa quy ước literal UUID dễ đọc theo bảng (prefix), liệt kê toàn bộ UUID hằng dùng lại ở các phần sau

## 2. Cleanup idempotent

- [x] 2.1 Xóa dữ liệu mock cũ theo scope teacher mock / literal UUID, thứ tự child→parent (hoặc dựa cascade), KHÔNG đụng row teachers/auth.users
- [x] 2.2 Cleanup `settings` theo teacher_id mock

## 3. Settings & Students

- [x] 3.1 Insert `settings` (1 row / teacher, unique teacher_id) cho cả 3 teacher
- [x] 3.2 Insert `students` đa dạng: có email / không email, và ≥1 học viên không thuộc lớp nào; phân bổ qua 3 teacher

## 4. Classes & cấu hình kỹ năng

- [x] 4.1 Insert lớp IELTS với `skill_config` mặc định 4 kỹ năng 0–9
- [x] 4.2 Insert ≥1 lớp custom `skill_config` (khác mặc định, vd TOEIC L/R)
- [x] 4.3 Đảm bảo có lớp gắn fee_type monthly và lớp gắn fee_type course (qua enrollment ở mục 5); phân lớp cho cả teacher thường và admin

## 5. Enrollments

- [x] 5.1 Insert enrollment đủ status: active, paused (có paused_at), dropped (có dropped_at)
- [x] 5.2 Insert enrollment fee_type monthly (có monthly_fee) và course (có course_fee), không trùng (student_id,class_id)

## 6. Schedule & Sessions

- [x] 6.1 Insert `schedule` với day_of_week 0–6 hợp lệ, start/end_time dạng `HH:MM:SS`, room/note
- [x] 6.2 Insert `sessions`: quá khứ (`current_date - n`), hôm nay (`current_date`), tương lai (`current_date + n`), với start/end_time và topic/note

## 7. Attendance & Homework

- [x] 7.1 Insert `attendance` cho session quá khứ + hôm nay: mix present/absent + note, không trùng (session_id,student_id)
- [x] 7.2 Insert `homeworks` đủ progress: not_done / in_progress / done, không trùng (session_id,student_id)

## 8. HW Assignments & Submissions

- [x] 8.1 Insert `hw_assignments` với assigned_at/due_date, trải qua nhiều tháng
- [x] 8.2 Insert `submissions`: submitted + chưa submitted, có chấm (score numeric + graded_at) + chưa chấm, không trùng (hw_assignment_id,student_id)

## 9. Fees & Payments

- [x] 9.1 Insert `fees` trải ≥2 mốc tháng (year/month smallint động theo current_date), mix paid true/false, có surcharge, không trùng (student_id,year,month)
- [x] 9.2 Insert `payments`: method cash + transfer, amount integer, paid_at động, nhiều period

## 10. Reviews & Comments

- [x] 10.1 Insert `reviews` với `scores` jsonb keyed khớp skill_config của lớp, tags text[], mix absent true/false (kèm absent_reason), không trùng (student_id,class_id,date)
- [x] 10.2 Insert `session_reviews` (gắn session_id) và `general_comments` (unique student_id,class_id)

## 11. Mock Tests

- [x] 11.1 Insert `mock_tests` ≥2 mốc tháng / lớp, `sections` jsonb đúng shape
- [x] 11.2 Insert `mock_test_results` cho học viên: `scores` jsonb keyed theo section + `total_score` numeric, không trùng (mock_test_id,student_id)

## 12. Verification & tài liệu

- [x] 12.1 Thêm khối `SELECT count(*)` cuối file cho mọi bảng đã seed
- [x] 12.2 Chạy thử trong Supabase SQL Editor (sau khi điền email thật) → xác nhận không lỗi, đọc count
- [x] 12.3 Chạy lại lần 2 → xác nhận idempotent (count không đổi, không lỗi)
- [x] 12.4 Cập nhật README.md / CLAUDE.md ghi chú về file seed (vị trí, cách chạy, đồng bộ khi đổi schema)
