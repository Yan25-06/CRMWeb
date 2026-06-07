## ADDED Requirements

### Requirement: Xóa phiếu nhận xét đã tạo
Trang đánh giá (`ReviewsPage`) SHALL cho phép giáo viên xóa một phiếu nhận xét đã tạo. Mỗi mục trong lịch sử đánh giá (`ReviewHistory`) SHALL có nút xóa; khi bấm, hệ thống SHALL hiển thị hộp thoại xác nhận trước khi xóa (theo đúng pattern xóa ở danh bạ học viên). Sau khi xác nhận, hệ thống SHALL gọi `reviewService.remove` và làm mới danh sách đánh giá, kèm thông báo toast.

#### Scenario: Xóa một phiếu nhận xét có xác nhận
- **WHEN** giáo viên bấm nút xóa trên một mục trong lịch sử đánh giá và xác nhận trong hộp thoại
- **THEN** phiếu nhận xét bị xóa khỏi cơ sở dữ liệu, danh sách được làm mới và hiển thị toast thành công

#### Scenario: Hủy xóa
- **WHEN** giáo viên bấm nút xóa nhưng hủy trong hộp thoại xác nhận
- **THEN** phiếu nhận xét không bị xóa và danh sách giữ nguyên

### Requirement: Ô nhập học phí dùng CurrencyInput định dạng VND
Các form nhập học phí — `PaymentModal` (số tiền thanh toán) và `EnrollmentModal` (học phí tháng / học phí khóa) — SHALL dùng `CurrencyInput` thay cho ô số thường, hiển thị placeholder `000đ`, tự chèn dấu chấm phân tách hàng nghìn khi gõ và hiển thị giá trị đã lưu dạng đã định dạng. Giá trị gửi đi khi lưu SHALL là số nguyên.

#### Scenario: Nhập số tiền thanh toán
- **WHEN** giáo viên mở `PaymentModal` và gõ `1400000` vào ô số tiền
- **THEN** ô hiển thị `1.400.000` trong lúc gõ và lưu giá trị `1400000`

#### Scenario: Nhập học phí trong ghi danh
- **WHEN** admin nhập học phí tháng hoặc học phí khóa trong `EnrollmentModal`
- **THEN** ô dùng định dạng dấu chấm hàng nghìn và lưu giá trị số nguyên

### Requirement: Ô sĩ số tối đa cho gõ số trực tiếp
Ô "Sĩ số tối đa" trong `ClassModal` SHALL cho phép gõ số trực tiếp mà không phụ thuộc vào nút mũi tên tăng/giảm (spinner). Ô SHALL dùng `inputMode="numeric"`, lọc bỏ ký tự không phải chữ số, và lưu giá trị dạng số nguyên.

#### Scenario: Gõ sĩ số trực tiếp
- **WHEN** giáo viên gõ `25` vào ô sĩ số tối đa
- **THEN** ô nhận giá trị `25` mà không cần bấm nút mũi tên

#### Scenario: Bỏ qua ký tự không phải số
- **WHEN** giáo viên gõ ký tự không phải chữ số vào ô sĩ số
- **THEN** ký tự đó bị bỏ qua, ô chỉ giữ lại chữ số

## MODIFIED Requirements

### Requirement: ClassModal cấu hình bộ kỹ năng của lớp
Form tạo/sửa lớp (`ClassModal`) SHALL cho phép giáo viên định nghĩa bộ kỹ năng của lớp gồm **tên kỹ năng và thứ tự** — KHÔNG còn cấu hình điểm tối đa (`maxScore`). Builder cấu hình kỹ năng SHALL không hiển thị ô nhập điểm tối đa. Khi không chỉnh, lớp SHALL dùng bộ kỹ năng IELTS mặc định (Listening/Reading/Writing/Speaking).

#### Scenario: Tạo lớp với bộ kỹ năng mặc định
- **WHEN** giáo viên tạo lớp mà không chỉnh phần kỹ năng
- **THEN** lớp được lưu với 4 kỹ năng IELTS mặc định, mỗi kỹ năng chỉ có tên và thứ tự

#### Scenario: Tùy chỉnh bộ kỹ năng
- **WHEN** giáo viên thêm/xóa/đổi tên kỹ năng rồi lưu lớp
- **THEN** `skillConfig` của lớp được cập nhật (chỉ tên + thứ tự) và áp dụng cho đánh giá lẫn mock test của lớp

#### Scenario: Không có ô điểm tối đa
- **WHEN** giáo viên mở builder cấu hình kỹ năng trong `ClassModal`
- **THEN** builder chỉ cho nhập tên kỹ năng, không có ô nhập điểm tối đa

### Requirement: ReviewForm render ô nhập điểm động theo cấu hình lớp
Form đánh giá (`ReviewForm`) SHALL render các ô nhập điểm theo các kỹ năng của lớp (`skillConfig`), và validate mỗi điểm trong khoảng `0..maxScore` trong đó `maxScore` SHALL lấy từ **mock test gần nhất** của học sinh (khi tạo mới) hoặc từ `scoreMax` đã lưu trong phiếu (khi chỉnh sửa). Nếu không xác định được thang điểm, hệ thống SHALL dùng thang IELTS mặc định 0–9.

#### Scenario: Hiển thị đúng các kỹ năng của lớp
- **WHEN** mở form đánh giá cho một lớp có bộ kỹ năng tùy chỉnh
- **THEN** form hiển thị đúng các ô nhập điểm theo tên và số lượng kỹ năng của lớp

#### Scenario: Validate theo điểm tối đa từ mock test
- **WHEN** giáo viên nhập điểm vượt `maxScore` lấy từ mock test gần nhất của một kỹ năng
- **THEN** form báo lỗi và không lưu cho tới khi điểm hợp lệ

### Requirement: ReviewForm điền sẵn điểm và nhận xét từ mock test gần nhất
Khi tạo đánh giá mới, `ReviewForm` SHALL điền sẵn điểm kỹ năng (`scores`), thang điểm tối đa (`scoreMax`) và nhận xét thêm (`remark`) từ mock test gần nhất của học sinh đang được đánh giá. Cả **điểm** lẫn **điểm tối đa** SHALL lấy từ mock test gần nhất (`result.scores` và `mockTest.sections`), map theo tên kỹ năng khớp với `skillConfig` của lớp. `scoreMax` SHALL được lưu snapshot vào phiếu khi tạo. Nếu học sinh **chưa có mock test nào**, hệ thống SHALL không cho tạo đánh giá mới (ẩn hoặc khóa nút "Thêm đánh giá") kèm hướng dẫn tạo mock test trước. Chế độ chỉnh sửa đánh giá hiện có SHALL không bị ảnh hưởng và SHALL giữ nguyên `scoreMax` đã lưu lúc tạo.

#### Scenario: Tạo đánh giá khi học sinh đã có mock test
- **WHEN** giáo viên mở form tạo đánh giá mới cho học sinh đã có ít nhất một kết quả mock test
- **THEN** các ô điểm kỹ năng được điền sẵn theo điểm của mock test gần nhất, thang điểm từng ô lấy theo `maxScore` của mock test đó, ô nhận xét thêm điền sẵn theo nhận xét của kết quả, và badge "Điền từ [tên test]" hiển thị

#### Scenario: Học sinh chưa có mock test — không cho tạo đánh giá
- **WHEN** giáo viên muốn tạo đánh giá mới cho học sinh chưa có kết quả mock test nào
- **THEN** nút "Thêm đánh giá" bị ẩn hoặc khóa và hiển thị hướng dẫn cần tạo mock test trước

#### Scenario: Xóa dữ liệu đã điền sẵn
- **WHEN** giáo viên bấm nút xóa trên badge nguồn dữ liệu
- **THEN** các ô điểm kỹ năng và nhận xét thêm được làm trống và badge biến mất

#### Scenario: Chỉnh sửa đánh giá giữ nguyên thang điểm lúc tạo
- **WHEN** giáo viên mở form chỉnh sửa một đánh giá đã có
- **THEN** form hiển thị đúng điểm và nhận xét đã lưu, validate theo `scoreMax` đã lưu trong phiếu, không điền lại theo mock test

### Requirement: MockTestModal kế thừa cấu hình kỹ năng của lớp
Khi tạo mock test mới, `MockTestModal` SHALL khởi tạo `sections` mặc định từ `skillConfig` của lớp (tên kỹ năng), với điểm tối đa mặc định (thang IELTS 9) vì `skillConfig` không còn lưu `maxScore`; giáo viên vẫn SHALL chỉnh được tên và điểm tối đa từng section trước khi lưu.

#### Scenario: Section mặc định theo kỹ năng của lớp
- **WHEN** giáo viên mở form tạo mock test mới cho một lớp
- **THEN** danh sách `sections` được điền sẵn theo tên các kỹ năng trong `skillConfig` của lớp đó, với điểm tối đa mặc định

#### Scenario: Giáo viên chỉnh section trước khi lưu
- **WHEN** giáo viên thêm/sửa/xóa section hoặc đổi điểm tối đa sau khi đã điền sẵn từ cấu hình lớp
- **THEN** mock test lưu theo sections đã chỉnh, không bị ghi đè bởi cấu hình lớp
