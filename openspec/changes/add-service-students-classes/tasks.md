## 1. Khung service layer

- [ ] 1.1 Tạo thư mục `src/services/`; thêm helper lấy `auth.uid()` hiện tại (đọc từ session của `supabase.auth`) dùng chung cho các `create`
- [ ] 1.2 Thống nhất quy ước: hàm async trả data hoặc ném `Error` khi `error` từ Supabase; không filter `teacher_id` khi đọc

## 2. studentService

- [ ] 2.1 `getAll()`, `getById(id)` — select từ `students`
- [ ] 2.2 `create(data)` — gán `teacher_id = auth.uid()`, insert, trả row mới
- [ ] 2.3 `update(id, data)` — update các cột nội dung, KHÔNG gửi `teacher_id`
- [ ] 2.4 `remove(id)` — delete theo id

## 3. classService

- [ ] 3.1 `getAll()`, `getById(id)` — select từ `classes`
- [ ] 3.2 `create(data)` — gán `teacher_id = auth.uid()`, insert
- [ ] 3.3 `update(id, data)` — update nội dung lớp, KHÔNG đổi `teacher_id`
- [ ] 3.4 `remove(id)` — delete theo id

## 4. enrollmentService

- [ ] 4.1 `getByClass(classId)` — select enrollments theo `class_id`
- [ ] 4.2 `getActiveByClass(classId)` — enrollments `status = 'active'` kèm join thông tin học sinh
- [ ] 4.3 `get(studentId, classId)` — một bản ghi theo khóa kép
- [ ] 4.4 `upsert(data)` — upsert theo `(student_id, class_id)`

## 5. Chuyển UI sang service async

- [ ] 5.1 `ClassesOverviewPage` — nạp danh sách lớp qua `classService` (loading/error), tạo/sửa/xóa qua service
- [ ] 5.2 `ClassDetailPage/index` + `StudentsTab` — nạp lớp, học sinh, enrollment qua service
- [ ] 5.3 `StudentDetailPanel` — nạp/sửa học sinh qua `studentService`
- [ ] 5.4 `EnrollmentModal` — ghi danh/đổi trạng thái qua `enrollmentService`
- [ ] 5.5 Phần học sinh/lớp của `DashboardPage` — nạp số liệu qua service (các phần dựa entity khác giữ `db.js` tạm thời)
- [ ] 5.6 Gỡ import `students`/`classes`/`enrollments` từ `db.js` ở các file đã chuyển; KHÔNG xóa `db.js`

## 6. Kiểm tra & bàn giao change

- [ ] 6.1 Chạy `openspec validate add-service-students-classes` và rà từng requirement đã được task/test nào phủ
- [ ] 6.2 Tổng kết cho người dùng: những gì change này đã làm (service layer cho students/classes/enrollments, UI nạp async, teacher_id gán tự động, không filter quyền ở client) và những gì CHƯA thuộc phạm vi (sessions/attendance ở #5, homework ở #6, banner offline + xóa `db.js` ở #9)
- [ ] 6.3 Viết hướng dẫn test thủ công cho người dùng và cùng chạy qua:
  - Đăng nhập teacher A → tạo học sinh, tạo lớp → thấy dữ liệu của A, không thấy dữ liệu của B
  - Đăng nhập teacher B → danh sách lớp/học sinh của A không xuất hiện
  - Teacher A sửa/xóa học sinh và lớp của mình → thành công
  - Mở `ClassesOverviewPage`, `StudentsTab`, `StudentDetailPanel` → có trạng thái loading trước khi hiện dữ liệu
  - Kiểm tra Network tab: không có request nào gọi `supabase.*` trực tiếp từ component (chỉ qua service)
  - `EnrollmentModal`: ghi danh học sinh vào lớp → upsert không tạo bản ghi trùng khi ghi danh lại
- [ ] 6.4 Ghi lại kết quả test + vấn đề tồn đọng; xác nhận với người dùng trước khi sang #5 (sessions/attendance)
