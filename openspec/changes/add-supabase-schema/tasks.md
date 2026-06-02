## 1. Supabase project & môi trường

- [ ] 1.1 Tạo Supabase project (free tier); lấy `Project URL` và `anon` key
- [ ] 1.2 Thêm `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` vào `.env`; thêm khóa tương ứng (giá trị rỗng) vào `.env.example`
- [ ] 1.3 `supabase init` trong repo (tạo thư mục `supabase/`); xác nhận `supabase login` + link project hoạt động trên Windows

## 2. Migration: teachers

- [ ] 2.1 Viết migration tạo bảng `teachers`: `id uuid PK references auth.users(id) on delete cascade`, `email text`, `name text`, `is_admin boolean default false`, `created_at`
- [ ] 2.2 Áp migration và xác nhận bảng `teachers` tồn tại trong DB

## 3. Migration: bảng nghiệp vụ

- [ ] 3.1 Đối chiếu các entity và trường trong `src/store/db.js` để xác định cột cho từng bảng
- [ ] 3.2 Viết migration `students`, `classes` (PK uuid, `teacher_id` FK → teachers) và `enrollments` (FK student_id/class_id)
- [ ] 3.3 Viết migration `sessions`, `attendance`, `schedule` (FK class_id/student_id phù hợp)
- [ ] 3.4 Viết migration `homeworks`, `hw_assignments`, `submissions`
- [ ] 3.5 Viết migration `fees`, `payments`
- [ ] 3.6 Viết migration `reviews`, `session_reviews`, `general_comments`
- [ ] 3.7 Viết migration `mock_tests`, `mock_test_results`, `settings`
- [ ] 3.8 Áp toàn bộ migration (`supabase db push` hoặc SQL editor) và xác nhận đủ 18 bảng

## 4. Database trigger: tự tạo teachers row

- [ ] 4.1 Viết migration tạo function `handle_new_user()` (SECURITY DEFINER): INSERT vào `teachers(id, email, name)` với `new.id`, `new.email`, `name = ''`
- [ ] 4.2 Viết migration tạo trigger `on_auth_user_created` (AFTER INSERT ON auth.users) gọi `handle_new_user()`
- [ ] 4.3 Áp migration trigger và xác nhận function + trigger tồn tại trong DB

## 5. Seed admin

- [ ] 5.1 Tạo 1 user admin qua Supabase Dashboard (Auth → Invite user hoặc Create user)
- [ ] 5.2 Xác nhận trigger tự tạo row `teachers` cho user vừa tạo
- [ ] 5.3 UPDATE `is_admin = true` cho row admin trong bảng `teachers`

## 6. Verify

- [ ] 6.1 Liệt kê bảng, xác nhận mỗi bảng có UUID PK và cột phân quyền (`teacher_id`/`class_id`/`student_id`) đúng theo spec
- [ ] 6.2 Test trigger: tạo user mới qua Dashboard → xác nhận row `teachers` được tạo tự động
- [ ] 6.3 Xác nhận tồn tại đúng 1 row `teachers` với `is_admin = true` liên kết tới user auth hợp lệ
