## 1. feeService

- [x] 1.1 `getByStudentMonth(studentId, year, month)` — bản ghi `fees` theo khóa kép (hoặc rỗng)
- [x] 1.2 `upsert(data)` — upsert theo `(student_id, year, month)` (`onConflict`)
- [x] 1.3 `calcFee(studentId, year, month)` — tính từ số buổi (qua service #5) × `fee_per_session` + `surcharge`, sao đúng logic cũ
- [x] 1.4 `isFeePaid(studentId, year, month)` — trả `fees.paid` từ bản ghi tương ứng

## 2. paymentService

- [x] 2.1 `getByStudent(studentId)` — lịch sử thanh toán theo học sinh
- [x] 2.2 `getByPeriod(period)` — thanh toán theo kỳ
- [x] 2.3 `getPaidAmount(studentId, period)` — tổng `amount` đã đóng trong kỳ
- [x] 2.4 `create(data)`, `remove(id)`

## 3. Chuyển UI sang service async

- [x] 3.1 `FeesPage` — nạp danh sách học phí + tính toán qua service (loading/error)
- [x] 3.2 `FeesTable` — hiển thị trạng thái học phí, đánh dấu đã đóng/phụ phí qua `feeService`
- [x] 3.3 `PaymentModal` — ghi nhận/xóa thanh toán qua `paymentService`
- [x] 3.4 `StudentPaymentHistoryPanel` — nạp lịch sử + tổng đã đóng qua `paymentService`
- [x] 3.5 Gỡ import `fees`/`payments` từ `db.js` ở file đã chuyển; KHÔNG xóa `db.js`

## 4. Kiểm tra & bàn giao change

- [x] 4.1 Chạy `openspec validate add-service-fees` và rà từng requirement đã được task/test nào phủ
- [ ] 4.2 Tổng kết cho người dùng: những gì change này đã làm (service layer cho fees/payments, upsert idempotent, tính học phí/tổng thanh toán client, UI nạp async) và những gì CHƯA thuộc phạm vi (reviews ở #8, mock-test/settings + xóa `db.js` ở #9)
- [ ] 4.3 Viết hướng dẫn test thủ công cho người dùng và cùng chạy qua:
  - Đăng nhập teacher A → mở `FeesPage` → bảng học phí nạp từ Supabase
  - Đánh dấu một học sinh đã đóng / thêm phụ phí → upsert thành công; làm lại cùng học sinh/tháng → không tạo bản ghi trùng (kiểm qua Supabase Table Editor)
  - Học phí phải đóng (`calcFee`) khớp với số buổi học thực tế của tháng
  - `PaymentModal`: ghi nhận một khoản thanh toán → hiện trong `StudentPaymentHistoryPanel`; xóa khoản → biến mất; tổng đã đóng cập nhật đúng
  - Đăng nhập teacher B → học phí và thanh toán của A không xuất hiện
- [ ] 4.4 Ghi lại kết quả test + vấn đề tồn đọng; xác nhận với người dùng trước khi sang #8 (reviews)
