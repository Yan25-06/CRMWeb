## ADDED Requirements

### Requirement: ClassModal cấu hình bộ kỹ năng của lớp
Form tạo/sửa lớp (`ClassModal`) SHALL cho phép giáo viên định nghĩa bộ kỹ năng của lớp (tên + điểm tối đa + thứ tự) dùng lại trình builder của mock test (`MockTestSectionBuilder`). Khi không chỉnh, lớp SHALL dùng bộ kỹ năng IELTS mặc định.

#### Scenario: Tạo lớp với bộ kỹ năng mặc định
- **WHEN** giáo viên tạo lớp mà không chỉnh phần kỹ năng
- **THEN** lớp được lưu với 4 kỹ năng IELTS (Listening/Reading/Writing/Speaking) thang 0–9

#### Scenario: Tùy chỉnh bộ kỹ năng
- **WHEN** giáo viên thêm/xóa/đổi tên kỹ năng hoặc đổi điểm tối đa rồi lưu lớp
- **THEN** `skillConfig` của lớp được cập nhật và áp dụng cho đánh giá lẫn mock test của lớp

### Requirement: ReviewForm render ô nhập điểm động theo cấu hình lớp
Form đánh giá (`ReviewForm`) SHALL render các ô nhập điểm theo `skillConfig` của lớp thay vì 4 kỹ năng cố định, và validate mỗi điểm trong khoảng `0..maxScore` của kỹ năng tương ứng.

#### Scenario: Hiển thị đúng các kỹ năng của lớp
- **WHEN** mở form đánh giá cho một lớp có bộ kỹ năng tùy chỉnh
- **THEN** form hiển thị đúng các ô nhập điểm theo tên và số lượng kỹ năng của lớp

#### Scenario: Validate theo điểm tối đa từng kỹ năng
- **WHEN** giáo viên nhập điểm vượt `maxScore` của một kỹ năng
- **THEN** form báo lỗi và không lưu cho tới khi điểm hợp lệ

### Requirement: Biểu đồ năng lực vẽ trục động và chuẩn hóa điểm
`RadarChartPanel` SHALL vẽ các trục theo `skillConfig` của lớp và chuẩn hóa điểm về phần trăm (`value / maxScore * 100`) để các kỹ năng khác thang điểm vẫn so sánh được trên cùng biểu đồ. Biểu đồ MAY overlay điểm mock test gần nhất dùng cùng phép chuẩn hóa.

#### Scenario: Trục biểu đồ khớp kỹ năng của lớp
- **WHEN** xem biểu đồ năng lực của học viên trong một lớp tùy chỉnh kỹ năng
- **THEN** các trục radar khớp đúng các kỹ năng trong `skillConfig` của lớp

#### Scenario: Chuẩn hóa điểm khác thang
- **WHEN** các kỹ năng có `maxScore` khác nhau
- **THEN** biểu đồ vẽ theo phần trăm trên trục 0–100 và tooltip hiển thị cả điểm gốc lẫn phần trăm

### Requirement: MockTestModal kế thừa cấu hình kỹ năng của lớp
Khi tạo mock test mới, `MockTestModal` SHALL khởi tạo `sections` mặc định từ `skillConfig` của lớp (tên + điểm tối đa), thay cho bộ section cố định; giáo viên vẫn SHALL chỉnh được trước khi lưu.

#### Scenario: Section mặc định theo kỹ năng của lớp
- **WHEN** giáo viên mở form tạo mock test mới cho một lớp
- **THEN** danh sách `sections` được điền sẵn theo `skillConfig` của lớp đó

#### Scenario: Giáo viên chỉnh section trước khi lưu
- **WHEN** giáo viên thêm/sửa/xóa section sau khi đã điền sẵn từ cấu hình lớp
- **THEN** mock test lưu theo sections đã chỉnh, không bị ghi đè bởi cấu hình lớp
