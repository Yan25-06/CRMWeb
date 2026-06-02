## Context

Change cuối lộ trình, sau #9 (cutover xong, mọi entity ở Supabase, db.js đã xóa). RLS (#3) đã cho admin SELECT-all và mở ngoại lệ ghi `classes` cho admin (tạo/giao/đổi `teacher_id`). `useAuth` (#2) cung cấp `teacher.is_admin` và `ProtectedRoute`. Quyết định lộ trình đã chốt: mời giáo viên qua Supabase Dashboard + trigger tự tạo `teachers` — **không** dùng Edge Function (khác với bản nháp cũ trong change gốc `add-supabase-multi-teacher`).

## Goals / Non-Goals

**Goals:**
- Route admin chặn theo `is_admin`.
- Admin tạo & giao/đổi lớp cho giáo viên qua `classService`.
- Admin xem read-only dữ liệu mọi giáo viên qua các service hiện có.

**Non-Goals:**
- Luồng invite trong app / Edge Function — làm qua Dashboard.
- Admin sửa/xóa dữ liệu nghiệp vụ — cấm ở DB và ẩn ở UI.
- Báo cáo/tổng hợp toàn trung tâm nâng cao (ngoài phạm vi; có thể là change tương lai).

## Decisions

**1. Guard admin tái dùng `ProtectedRoute` + cờ `is_admin`.**
Route admin bọc trong guard kiểm `teacher.is_admin`; không phải admin → redirect về trang chính. Không dựng cơ chế phân quyền mới.

**2. Tạo/giao lớp dùng `classService`, không thêm service riêng.**
Admin gọi `classService.create({ ..., teacher_id })` và `classService.update(id, { teacher_id })`. RLS đã cho phép admin ghi `classes`. Lưu ý: `classService.create`/`update` từ #4 mặc định không gửi `teacher_id` (luồng teacher); cần cho phép truyền `teacher_id` tường minh ở luồng admin.

**3. Xem read-only dùng lại service đọc hiện có.**
Admin chọn một giáo viên → gọi các service đọc (students/classes/sessions…) vốn trả SELECT-all cho admin nhờ RLS, rồi lọc hiển thị theo giáo viên đã chọn ở client. Không cần service admin riêng.

**4. UI admin ẩn mọi nút ghi nghiệp vụ.**
Tái dùng component xem nhưng truyền cờ `readOnly` để ẩn nút sửa/xóa; phòng tuyến thật vẫn là DB (admin không có policy ghi).

**5. Danh sách giáo viên đọc từ `teachers`.**
Thêm truy vấn đọc danh sách `teachers` (admin SELECT-all theo policy #3) để chọn người nhận lớp và để xem theo giáo viên.

## Risks / Trade-offs

- **`classService` cần mở đường truyền `teacher_id` cho admin** — nếu quên, admin không giao được lớp. Mitigation: thêm tham số `teacher_id` tường minh ở luồng admin, giữ luồng teacher không đổi.
- **Lọc read-only ở client** — admin tải nhiều dữ liệu rồi lọc; với quy mô 5 giáo viên chấp nhận được. Nếu phình to, sau này thêm filter phía service.
- **Nhầm lẫn quyền ghi** — admin thấy giao diện xem giống teacher, dễ tưởng sửa được. Mitigation: ẩn nút + nhãn rõ "chế độ chỉ đọc"; DB là chốt chặn cuối.
- **Phụ thuộc trigger tạo `teachers`** — nếu trigger lỗi, giáo viên được mời không hiện trong danh sách. Mitigation: đã test ở #1; ghi chú quy trình mời trong tài liệu bàn giao.
