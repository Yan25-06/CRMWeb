## MODIFIED Requirements

### Requirement: Lớp học chứa cấu hình kỹ năng (skillConfig)
Mô hình `Class` SHALL có trường `skillConfig`: một mảng `{ name: string, order: number }` định nghĩa các kỹ năng được chấm điểm cho lớp đó. Cấu hình kỹ năng SHALL chỉ gồm **tên kỹ năng** và **thứ tự** — KHÔNG còn `maxScore` (thang điểm được lấy từ mock test gần nhất tại thời điểm đánh giá). Khi lớp không có cấu hình (null/rỗng), hệ thống SHALL fallback về bộ mặc định IELTS 4 kỹ năng (Listening, Reading, Writing, Speaking). Giá trị `maxScore` còn sót trong dữ liệu cũ SHALL bị bỏ qua ở application layer.

#### Scenario: Lớp mới dùng cấu hình kỹ năng mặc định
- **WHEN** một lớp được tạo mà không chỉnh cấu hình kỹ năng
- **THEN** `skillConfig` của lớp là 4 kỹ năng IELTS mặc định (Listening/Reading/Writing/Speaking), mỗi mục chỉ có `name` và `order`

#### Scenario: Lớp tùy chỉnh bộ kỹ năng riêng
- **WHEN** giáo viên cấu hình lớp với bộ kỹ năng khác (thêm/xóa/đổi tên kỹ năng)
- **THEN** `skillConfig` lưu đúng danh sách kỹ năng đó (chỉ `name` + `order`) và được dùng cho cả đánh giá lẫn mock test của lớp

#### Scenario: Bỏ qua maxScore trong dữ liệu cũ
- **WHEN** đọc một lớp có `skill_config` cũ còn chứa `maxScore`
- **THEN** application layer chỉ lấy `name` và `order`, không sử dụng `maxScore`

### Requirement: Bản ghi đánh giá lưu điểm kỹ năng dạng map động
Mô hình `ReviewRecord` SHALL lưu điểm kỹ năng trong trường `scores` — một object keyed theo **tên kỹ năng** (`{ [skillName]: number }`) thay vì các trường điểm cố định cho từng kỹ năng. Bản ghi SHALL lưu thêm trường `scoreMax` — một object keyed theo tên kỹ năng (`{ [skillName]: number }`) ghi lại **snapshot thang điểm tối đa** từ mock test gần nhất tại thời điểm tạo đánh giá. Cấu trúc `scores` SHALL nhất quán với `scores` của kết quả mock test để cho phép đối chiếu.

#### Scenario: Lưu điểm theo kỹ năng của lớp
- **WHEN** giáo viên nhập điểm cho một đánh giá của lớp có `skillConfig` gồm các kỹ năng A, B, C
- **THEN** bản ghi lưu `scores = { A: ..., B: ..., C: ... }` keyed theo tên kỹ năng

#### Scenario: Lưu snapshot thang điểm tối đa
- **WHEN** giáo viên tạo đánh giá mới điền sẵn từ mock test gần nhất có thang điểm `{ A: 9, B: 100 }`
- **THEN** bản ghi lưu `scoreMax = { A: 9, B: 100 }` để giữ nguyên thang điểm lúc tạo khi mở lại để chỉnh sửa

#### Scenario: Đọc lại điểm để hiển thị biểu đồ
- **WHEN** một component đọc một `ReviewRecord`
- **THEN** `scores` trả về dạng object JS keyed theo tên kỹ năng để render trục biểu đồ năng lực, và `scoreMax` cung cấp thang điểm chuẩn hóa
