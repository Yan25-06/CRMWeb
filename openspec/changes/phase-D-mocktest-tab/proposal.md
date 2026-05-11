# Proposal: Phase D — Tab Mock Test

## Status: 🔲 TODO (sau Phase C)

## Intent
Xây dựng tab "Mock Test": GV tạo bài kiểm tra với nhiều phần thi
(Listening, Reading, Writing, Speaking...), nhập điểm per học viên,
xem hồ sơ thi và xuất kết quả ra Excel hoặc Text.

## Scope
- Data models: MockTest, MockTestSection, MockTestResult
- Sidebar HS + màn chính (danh sách tests / hồ sơ thi)
- MockTestModal: tạo/sửa test với section builder linh hoạt
- Nhập điểm per HS per section, auto-save, auto-total
- Line chart điểm tổng theo thời gian (Chart.js, ≥2 tests)
- Nhận xét GV riêng per HS per test
- Xuất Excel: toàn lớp (2 sheets)
- Xuất Text: per học viên

## Out of Scope
- Import điểm từ file
- Học viên tự xem kết quả

## Dependencies
- Phase A: StudentSidebar component tái sử dụng
- Phase B: Session (không dùng trực tiếp, MockTest độc lập với Session)
- chart.js + react-chartjs-2 (đã có trong package.json)
- SheetJS/xlsx (đã có trong package.json)

## Approach
- MockTest hoàn toàn độc lập với Session (không link)
- Sections do GV định nghĩa per test (không cố định)
- Sidebar HS: click → xem hồ sơ thi cá nhân
- Màn chính mặc định (không chọn HS): danh sách all tests + bảng điểm
- ScoreInputRow auto-save khi blur, validate không vượt maxScore
