## Context

App là React 18 + Vite. Toàn bộ dữ liệu hiện đọc/ghi đồng bộ qua `src/store/db.js` (localStorage). Schema PostgreSQL (#1) và RLS (#3) đã sẵn sàng; `supabase` client đã có ở `src/lib/supabase.js`; `useAuth` cung cấp `user`/`teacher`. Đây là change service-layer đầu tiên, mở đường cho #5–#9. Ba entity gốc `students`/`classes`/`enrollments` phải chuyển trước vì các bảng con suy quyền qua `class_id`/`student_id`.

## Goals / Non-Goals

**Goals:**
- Tạo `src/services/` với một file service mỗi entity gốc, trả Promise, cô lập `supabase` khỏi UI.
- Chuyển các component lớp/học sinh sang nạp async (loading/error state).
- Giữ db.js còn nguyên cho các entity chưa migrate (#5–#9 sẽ dùng).

**Non-Goals:**
- Optimistic UI (để #5 cho điểm danh) — change này dùng load-then-render đơn giản.
- Banner offline toàn cục + retry (thuộc #9).
- Xóa `db.js` (cutover ở #9).
- UI admin tạo/giao lớp (thuộc #10).

## Decisions

**1. Một file service mỗi entity (`studentService`, `classService`, `enrollmentService`).**
Mỗi file export `getAll/getById/create/update/remove` (và hàm truy vấn riêng như `enrollmentService.getActiveByClass`). Hàm async bọc `supabase.from(...)`, ném lỗi khi `error` để UI bắt. Khớp quyết định kiến trúc của lộ trình: đổi backend chỉ sửa `src/services/`.

**2. `create` gán `teacher_id = auth.uid()` ở service, không ở UI.**
Lấy uid từ `supabase.auth.getUser()` (hoặc session cache) trong service. UI chỉ truyền dữ liệu nghiệp vụ. `update` không gửi `teacher_id` để khỏi vi phạm policy "teacher không đổi quyền sở hữu".

**3. Đọc KHÔNG filter `teacher_id`.**
RLS đã enforce phân tách; thêm filter ở client là thừa và sai nguyên tắc (đã chốt ở lộ trình: enforce ở PostgreSQL, không filter ở frontend).

**4. UI nạp async trong `useEffect` + `useState`.**
Mỗi trang/panel giữ `{ data, loading, error }`. Sau thao tác ghi, re-fetch hoặc cập nhật state cục bộ. Không thêm thư viện state mới (không React Query) — giữ tối giản cho 5 user.

**5. Mapping field snake_case ↔ camelCase tối thiểu.**
DB dùng snake_case (`teacher_id`, `max_students`, `schedule_days`). Service trả nguyên field DB; component đọc theo tên DB để giảm lớp chuyển đổi. Nếu component cũ dùng camelCase, đổi tại chỗ tiêu thụ.

## Risks / Trade-offs

- **Trạng thái hỗn hợp trong lúc migrate** — students/classes ở Supabase nhưng sessions/attendance còn ở localStorage cho tới #5/#6. Vì chỉ là mock data nên chấp nhận; làm theo đúng thứ tự phụ thuộc của lộ trình giảm thiểu tham chiếu gãy.
- **Chuyển sync→async lan tỏa nhiều component** — render phải xử lý loading/null. Trade-off bắt buộc khi rời localStorage; gói gọn theo từng trang để review dễ.
- **Lấy `auth.uid()` trong service** — nếu session hết hạn, `create` sẽ lỗi; UI hiển thị lỗi và `useAuth`/`ProtectedRoute` (từ #2) xử lý đăng nhập lại.
- **Không cache** — mỗi lần vào trang gọi lại Supabase; chấp nhận với quy mô 5 giáo viên.
