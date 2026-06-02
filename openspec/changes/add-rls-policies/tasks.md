## 1. Helper & policy cho teachers

- [ ] 1.1 Viết migration tạo function `is_admin()` (SECURITY DEFINER): trả `true` nếu `teachers.is_admin` của `auth.uid()` là true
- [ ] 1.2 Bật RLS trên `teachers`; policy SELECT: `id = auth.uid()` OR `is_admin()`
- [ ] 1.3 Policy UPDATE `teachers`: `id = auth.uid()`; trigger/policy chặn đổi cột `is_admin`
- [ ] 1.4 Áp migration; test ngay: đăng nhập admin → `useAuth` vẫn nạp được profile (không vỡ login)

## 2. Policy bảng gốc

- [ ] 2.1 Bật RLS trên `students`; policy SELECT (`teacher_id = auth.uid()` OR `is_admin()`), INSERT/UPDATE/DELETE chỉ `teacher_id = auth.uid()`
- [ ] 2.2 Bật RLS trên `classes`; SELECT (`teacher_id = auth.uid()` OR `is_admin()`); teacher UPDATE nội dung lớp mình, KHÔNG đổi `teacher_id`
- [ ] 2.3 Ngoại lệ admin trên `classes`: cho admin INSERT và UPDATE/DELETE `teacher_id` (giao/đổi/gỡ lớp); ghi comment cảnh báo đây là ngoại lệ ghi duy nhất của admin

## 3. Policy bảng con (suy quyền qua cha)

- [ ] 3.1 `enrollments`, `sessions`, `attendance`, `schedule`: RLS + policy theo `class_id`/`student_id` thuộc `auth.uid()`; admin SELECT all
- [ ] 3.2 `homeworks`, `hw_assignments`, `submissions`: RLS + policy suy quyền qua cha
- [ ] 3.3 `fees`, `payments`: RLS + policy suy quyền qua cha
- [ ] 3.4 `reviews`, `session_reviews`, `general_comments`: RLS + policy suy quyền qua cha
- [ ] 3.5 `mock_tests`, `mock_test_results`, `settings`: RLS + policy suy quyền qua cha (hoặc `teacher_id` nếu áp dụng)
- [ ] 3.6 Xác nhận KHÔNG có policy INSERT/UPDATE/DELETE nào cho nhánh admin trên các bảng nghiệp vụ (trừ `classes`)

## 4. Áp & test phân tách

- [ ] 4.1 Áp toàn bộ migration RLS lên project
- [ ] 4.2 Chuẩn bị dữ liệu test: 2 tài khoản teacher (A, B) + admin; mỗi teacher có lớp/học sinh riêng (tạm seed qua Dashboard hoặc SQL với service_role)
- [ ] 4.3 Test teacher A: chỉ đọc được lớp/học sinh của A; query dữ liệu B trả rỗng
- [ ] 4.4 Test teacher A ghi: tạo/sửa được dữ liệu của A; bị từ chối khi ghi vào dữ liệu B
- [ ] 4.5 Test admin: SELECT thấy dữ liệu cả A và B; mọi INSERT/UPDATE/DELETE dữ liệu nghiệp vụ bị từ chối
- [ ] 4.6 Test admin `classes`: tạo lớp + gán teacher thành công; test teacher KHÔNG đổi được `teacher_id` sang người khác; test teacher KHÔNG tự nâng `is_admin`

## 5. Kiểm tra & bàn giao change

- [ ] 5.1 Chạy `openspec validate add-rls-policies` và rà từng requirement đã được task/test nào phủ
- [ ] 5.2 Tổng kết cho người dùng: những gì change này đã làm (RLS bật trên mọi bảng, phân tách teacher A/B, admin read-only, ngoại lệ admin giao lớp) và những gì CHƯA thuộc phạm vi (service layer, UI admin)
- [ ] 5.3 Viết hướng dẫn test thủ công cho người dùng và cùng chạy qua:
  - Đăng nhập teacher A → chỉ thấy dữ liệu của A (kiểm qua app hoặc Supabase SQL với JWT của A)
  - Thử đọc dữ liệu của B → rỗng
  - Teacher A ghi dữ liệu của mình → OK; ghi dữ liệu B → bị chặn
  - Đăng nhập admin → thấy dữ liệu mọi giáo viên; thử sửa/xóa dữ liệu nghiệp vụ → bị chặn
  - Admin tạo & giao lớp → teacher được giao thấy lớp đó
  - Đăng nhập vẫn hoạt động bình thường (policy self-read `teachers` không vỡ login)
- [ ] 5.4 Ghi lại kết quả test + vấn đề tồn đọng; xác nhận với người dùng trước khi sang các change service layer (#4)
