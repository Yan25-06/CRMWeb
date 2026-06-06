## ADDED Requirements

### Requirement: FeesPage lọc theo lớp

`FeesPage` SHALL cung cấp bộ chọn lớp cho phép lọc bảng học phí tháng hiện tại theo một lớp cụ thể hoặc tất cả các lớp. Danh sách lớp SHALL được suy ra từ các giá trị `className` duy nhất trong dữ liệu học phí của tháng đang xem (`buildFeesRows`), kèm tùy chọn "Tất cả lớp" làm mặc định. Bộ lọc lớp SHALL áp dụng client-side và kết hợp (giao) với bộ lọc trạng thái thanh toán hiện có; dữ liệu xuất Excel SHALL phản ánh cả hai bộ lọc đang áp dụng.

#### Scenario: Chọn một lớp cụ thể
- **WHEN** giáo viên chọn một lớp trong bộ chọn lớp
- **THEN** bảng học phí chỉ hiển thị học viên thuộc lớp đó, và các thẻ/bộ đếm trạng thái thanh toán phản ánh tập học viên đã lọc

#### Scenario: Chọn "Tất cả lớp"
- **WHEN** giáo viên chọn "Tất cả lớp" (mặc định)
- **THEN** bảng học phí hiển thị học viên của mọi lớp trong tháng

#### Scenario: Kết hợp lọc lớp và trạng thái thanh toán
- **WHEN** giáo viên chọn một lớp và đồng thời chọn bộ lọc trạng thái "Còn nợ"
- **THEN** bảng chỉ hiển thị học viên thuộc lớp đó và đang còn nợ

#### Scenario: Xuất Excel theo lớp đã lọc
- **WHEN** giáo viên đã chọn một lớp rồi bấm xuất Excel
- **THEN** file xuất chỉ chứa học viên thuộc lớp đang lọc (đồng thời theo trạng thái thanh toán đang chọn)

### Requirement: SessionModal điền sẵn giờ theo lịch lớp khi tạo buổi

Khi tạo buổi học mới, `SessionModal` SHALL điền sẵn giờ bắt đầu và giờ kết thúc bằng cách parse `scheduleTime` của lớp (định dạng `"HH:MM-HH:MM"`, ví dụ `"19:00-20:30"`). Nếu `scheduleTime` rỗng hoặc không parse được thành cặp giờ hợp lệ, `SessionModal` SHALL fallback về giá trị mặc định `08:00`/`09:30`. Giáo viên SHALL vẫn chỉnh sửa được giờ sau khi điền sẵn. Chế độ chỉnh sửa buổi học hiện có SHALL tiếp tục dùng giờ đã lưu của buổi, không bị ghi đè.

#### Scenario: Tạo buổi với lịch lớp hợp lệ
- **WHEN** giáo viên mở form tạo buổi học mới cho lớp có `scheduleTime = "19:00-20:30"`
- **THEN** ô giờ bắt đầu hiển thị `19:00` và ô giờ kết thúc hiển thị `20:30`

#### Scenario: Lớp không có lịch giờ hợp lệ
- **WHEN** giáo viên mở form tạo buổi học mới cho lớp có `scheduleTime` rỗng hoặc không đúng định dạng
- **THEN** ô giờ bắt đầu hiển thị `08:00` và ô giờ kết thúc hiển thị `09:30`

#### Scenario: Chỉnh sửa buổi học không bị ghi đè
- **WHEN** giáo viên mở form chỉnh sửa một buổi học đã có giờ riêng
- **THEN** form hiển thị đúng giờ bắt đầu/kết thúc đã lưu của buổi đó, không lấy theo lịch lớp

### Requirement: ReviewForm điền sẵn điểm và nhận xét từ mock test gần nhất

Khi tạo đánh giá mới, `ReviewForm` SHALL điền sẵn điểm kỹ năng (`scores`) và nhận xét thêm (`remark`) từ mock test gần nhất của học sinh đang được đánh giá, nếu có. Điểm SHALL được map theo tên kỹ năng khớp giữa kết quả mock test và `skillConfig` của lớp; kỹ năng không có điểm tương ứng để trống. Form SHALL hiển thị chỉ báo nguồn dữ liệu dạng badge "Điền từ [tên mock test]" kèm nút xóa để bỏ toàn bộ dữ liệu đã điền sẵn. Chế độ chỉnh sửa đánh giá hiện có SHALL không bị ảnh hưởng (giữ nguyên dữ liệu đang sửa).

#### Scenario: Tạo đánh giá khi học sinh đã có mock test
- **WHEN** giáo viên mở form tạo đánh giá mới cho học sinh đã có ít nhất một kết quả mock test
- **THEN** các ô điểm kỹ năng được điền sẵn theo điểm của mock test gần nhất, ô nhận xét thêm điền sẵn theo nhận xét của kết quả đó, và badge "Điền từ [tên test]" hiển thị

#### Scenario: Xóa dữ liệu đã điền sẵn
- **WHEN** giáo viên bấm nút xóa trên badge nguồn dữ liệu
- **THEN** các ô điểm kỹ năng và nhận xét thêm được làm trống và badge biến mất

#### Scenario: Học sinh chưa có mock test
- **WHEN** giáo viên mở form tạo đánh giá mới cho học sinh chưa có kết quả mock test nào
- **THEN** form mở ở trạng thái trống bình thường, không hiển thị badge nguồn dữ liệu

#### Scenario: Chỉnh sửa đánh giá không bị ghi đè
- **WHEN** giáo viên mở form chỉnh sửa một đánh giá đã có
- **THEN** form hiển thị đúng điểm và nhận xét đã lưu của đánh giá đó, không điền theo mock test
