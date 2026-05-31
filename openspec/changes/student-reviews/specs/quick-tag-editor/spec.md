## ADDED Requirements

### Requirement: QuickTagEditor — nhãn nhận xét soạn sẵn
The system SHALL provide a tag-based quick review editor with two groups of predefined tags: positive (green) and needs-improvement (amber/red).

#### Scenario: Hiển thị nhãn soạn sẵn
- **WHEN** user đang tạo nhận xét cho học viên
- **THEN** hiển thị 2 nhóm nhãn: Tích cực (👍 xanh) và Cần cố gắng (⚠️ vàng), mỗi nhãn dạng pill button

#### Scenario: Click chọn nhãn
- **WHEN** user click vào một nhãn
- **THEN** nhãn được highlight (active state), thêm vào danh sách `tags[]` đã chọn

#### Scenario: Bỏ chọn nhãn
- **WHEN** user click lại vào nhãn đã chọn
- **THEN** nhãn được bỏ highlight, xóa khỏi `tags[]`

#### Scenario: Tổng hợp tags thành câu nhận xét
- **WHEN** user đã chọn >= 1 tag
- **THEN** hệ thống hiển thị preview nhận xét tổng hợp từ các tag (VD: "Hăng hái phát biểu, phát âm chuẩn. Cần luyện viết thêm.")

### Requirement: Nhãn mặc định
The system SHALL provide the following predefined tags:
- Tích cực: "Hăng hái", "Phát âm chuẩn", "Làm tốt bài tập", "Hiểu bài nhanh", "Tiến bộ rõ rệt"
- Cần cố gắng: "Quên bài tập", "Còn thụ động", "Cần luyện viết thêm", "Đến muộn", "Chưa tập trung"

#### Scenario: Render đủ nhãn mặc định
- **WHEN** QuickTagEditor render
- **THEN** hiển thị 5 nhãn tích cực (xanh) và 5 nhãn cần cố gắng (vàng/đỏ)
