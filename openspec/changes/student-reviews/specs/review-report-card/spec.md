## ADDED Requirements

### Requirement: ReportCardModal — preview và xuất phiếu kết quả
The system SHALL provide a modal to preview and export a professional report card for a student, containing logo, scores, radar chart, tags summary, and personalized advice.

#### Scenario: Mở preview phiếu kết quả
- **WHEN** user click "Xuất Phiếu Gửi Phụ Huynh"
- **THEN** modal mở hiển thị preview phiếu kết quả với: header (logo + tên trung tâm), thông tin học viên (tên, lớp), biểu đồ radar, bảng điểm 4 kỹ năng, nhãn nhận xét tổng hợp, lời khuyên, footer (tên giáo viên, ngày)

#### Scenario: Tải ảnh PNG
- **WHEN** user click "Tải Ảnh" trong modal preview
- **THEN** `html2canvas` chụp DOM phiếu kết quả với `scale: 2`, download file PNG với tên `phieu-nhan-xet-<tên HV>-<YYYY-MM-DD>.png`

#### Scenario: Tải PDF
- **WHEN** user click "Tải PDF" trong modal preview
- **THEN** `html2canvas` → `jspdf` tạo file PDF, download với tên `phieu-nhan-xet-<tên HV>-<YYYY-MM-DD>.pdf`

#### Scenario: Không có dữ liệu đánh giá
- **WHEN** học viên chưa có review nào
- **THEN** nút "Xuất Phiếu" disabled với tooltip "Cần tạo đánh giá trước khi xuất phiếu"

### Requirement: Report Card Layout
The report card SHALL use a professional design with the center logo (from settings), navy color scheme, and clean typography matching the app's design system.

#### Scenario: Hiển thị logo trung tâm
- **WHEN** report card render
- **THEN** header hiển thị `settings.centerName` với font display, styled theo navy palette

#### Scenario: Biểu đồ radar trong phiếu
- **WHEN** report card render
- **THEN** biểu đồ radar được nhúng trong phiếu, hiển thị đợt đánh giá mới nhất
