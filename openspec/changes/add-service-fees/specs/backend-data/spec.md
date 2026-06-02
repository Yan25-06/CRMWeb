## ADDED Requirements

### Requirement: Fee service cô lập học phí theo tháng
Hệ thống SHALL truy cập dữ liệu `fees` qua một service (`src/services/feeService.js`) expose async: đọc trạng thái học phí theo `(student_id, year, month)`, upsert trạng thái học phí, tính học phí phải đóng (`calcFee`) và kiểm tra đã đóng (`isFeePaid`) — trả Promise. Component UI SHALL KHÔNG gọi `supabase.from('fees')` trực tiếp.

#### Scenario: Đọc học phí của học sinh theo tháng
- **WHEN** trang học phí cần trạng thái học phí của một học sinh trong một tháng
- **THEN** `feeService` trả về bản ghi `fees` theo `(student_id, year, month)` hoặc rỗng nếu chưa có

#### Scenario: Upsert học phí idempotent
- **WHEN** cập nhật phụ phí hoặc đánh dấu đã đóng cho một học sinh trong một tháng đã có bản ghi
- **THEN** service upsert theo `(student_id, year, month)` không tạo bản ghi trùng

#### Scenario: Tính học phí phải đóng
- **WHEN** cần học phí phải đóng của một học sinh trong một tháng
- **THEN** service tính từ số buổi học và đơn giá/phụ phí, trả về số tiền nhất quán với logic nghiệp vụ hiện có

### Requirement: Payment service cô lập lịch sử thanh toán
Hệ thống SHALL truy cập dữ liệu `payments` qua một service (`src/services/paymentService.js`) expose async: đọc theo học sinh, đọc theo kỳ, tính tổng đã đóng của một học sinh trong một kỳ, tạo và xóa thanh toán — trả Promise.

#### Scenario: Đọc lịch sử thanh toán của học sinh
- **WHEN** mở panel lịch sử thanh toán của một học sinh
- **THEN** `paymentService` trả về các bản ghi `payments` theo `student_id`

#### Scenario: Tính tổng đã đóng theo kỳ
- **WHEN** cần tổng số tiền một học sinh đã đóng trong một kỳ
- **THEN** service cộng `amount` các thanh toán có `period` tương ứng

#### Scenario: Tạo và xóa thanh toán
- **WHEN** giáo viên ghi nhận một khoản thanh toán hoặc xóa một khoản đã nhập
- **THEN** service insert/delete bản ghi `payments` và trả về kết quả; RLS cho phép vì học sinh thuộc giáo viên

### Requirement: Component học phí dùng trạng thái async
Hệ thống SHALL cho các component tiêu thụ fees/payments nạp dữ liệu bất đồng bộ (loading + error state) thay vì đọc đồng bộ từ localStorage; thao tác ghi SHALL phản ánh lại UI sau khi Promise resolve.

#### Scenario: Hiển thị trạng thái tải
- **WHEN** bảng học phí đang chờ service trả dữ liệu
- **THEN** UI hiển thị trạng thái đang tải rồi hiển thị dữ liệu khi resolve

#### Scenario: Báo lỗi khi ghi thất bại
- **WHEN** một lời gọi service fees/payments bị từ chối
- **THEN** UI hiển thị thông báo lỗi thay vì trạng thái sai
