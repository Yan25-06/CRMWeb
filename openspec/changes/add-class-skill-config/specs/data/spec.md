## ADDED Requirements

### Requirement: Lớp học chứa cấu hình kỹ năng (skillConfig)
Mô hình `Class` SHALL có trường `skillConfig`: một mảng `{ name: string, maxScore: number, order: number }` định nghĩa các kỹ năng được chấm điểm cho lớp đó. Khi lớp không có cấu hình (null/rỗng), hệ thống SHALL fallback về bộ mặc định IELTS 4 kỹ năng (Listening, Reading, Writing, Speaking) thang điểm 0–9.

#### Scenario: Lớp mới dùng cấu hình kỹ năng mặc định
- **WHEN** một lớp được tạo mà không chỉnh cấu hình kỹ năng
- **THEN** `skillConfig` của lớp là 4 kỹ năng IELTS mặc định với `maxScore = 9`

#### Scenario: Lớp tùy chỉnh bộ kỹ năng riêng
- **WHEN** giáo viên cấu hình lớp với bộ kỹ năng khác (ví dụ Listening/Reading thang 495 cho TOEIC)
- **THEN** `skillConfig` lưu đúng danh sách kỹ năng đó và được dùng cho cả đánh giá lẫn mock test của lớp

### Requirement: Bản ghi đánh giá lưu điểm kỹ năng dạng map động
Mô hình `ReviewRecord` SHALL lưu điểm kỹ năng trong trường `scores` — một object keyed theo **tên kỹ năng** (`{ [skillName]: number }`) thay vì các trường điểm cố định cho từng kỹ năng. Cấu trúc này SHALL nhất quán với `scores` của kết quả mock test để cho phép đối chiếu.

#### Scenario: Lưu điểm theo kỹ năng của lớp
- **WHEN** giáo viên nhập điểm cho một đánh giá của lớp có `skillConfig` gồm các kỹ năng A, B, C
- **THEN** bản ghi lưu `scores = { A: ..., B: ..., C: ... }` keyed theo tên kỹ năng

#### Scenario: Đọc lại điểm để hiển thị biểu đồ
- **WHEN** một component đọc một `ReviewRecord`
- **THEN** `scores` trả về dạng object JS keyed theo tên kỹ năng để render trục biểu đồ năng lực

## REMOVED Requirements

### Requirement: Bản ghi đánh giá dùng cột điểm 4 kỹ năng cố định
**Reason**: Thay bằng `scores` map động keyed theo tên kỹ năng để đồng bộ với mock test và hỗ trợ bộ kỹ năng tùy chỉnh theo lớp.
**Migration**: Bỏ các trường `listenScore`/`speakScore`/`readScore`/`writeScore`; dữ liệu cũ không được bảo toàn (chưa có dữ liệu quan trọng). Điểm chuyển sang `scores` keyed theo tên kỹ năng.
