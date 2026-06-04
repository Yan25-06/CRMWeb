## MODIFIED Requirements

### Requirement: ReportsPage — dashboard báo cáo
The system SHALL add a top-level route/tab "Báo Cáo" (`ReportsPage`) hiển thị các card báo cáo, mỗi card có nút xuất Excel và xuất PDF. `ReportsPage` SHALL cung cấp một **bộ chọn lớp chung ở đầu trang** áp dụng cho tất cả biểu đồ; từng card KHÔNG còn selector lớp riêng (filter khoảng tháng / chọn học viên có thể giữ ở card khi mang tính cục bộ).

Các card:
1. **Điểm Danh theo tháng**: line/bar chart tỉ lệ có mặt theo từng học viên hoặc lớp, theo lớp đang chọn + khoảng tháng.
2. **Tiến độ Mock Test**: line chart điểm Mock Test theo thời gian cho lớp đang chọn, hiển thị **toàn bộ học sinh** (không giới hạn 5), dùng legend để ẩn/hiện series.
3. **Tổng thu Học Phí**: bar chart tổng thu theo tháng + bảng "Học viên còn nợ".
4. **Tiến độ Bài Tập**: chart số bài nộp / số bài giao theo thời gian cho lớp đang chọn.

#### Scenario: Đổi lớp chung
- **WHEN** user đổi lớp ở bộ chọn lớp chung đầu trang
- **THEN** tất cả các card báo cáo refresh theo lớp mới

#### Scenario: Đổi filter cục bộ trong card
- **WHEN** user đổi filter cục bộ (khoảng tháng/học viên) trong 1 card
- **THEN** chart và data trong card đó refresh, các card khác không bị ảnh hưởng

#### Scenario: Mock Test hiển thị toàn bộ học sinh
- **WHEN** lớp đang chọn có nhiều hơn 5 học sinh
- **THEN** card Mock Test render series cho tất cả học sinh (có thể ẩn/hiện qua legend), không cắt cứng còn 5

#### Scenario: Xuất Excel
- **WHEN** user bấm "Xuất Excel" ở 1 card
- **THEN** trình duyệt download file `.xlsx` với data hiện tại của card đó, tên file dạng `bao-cao-<loai>-<YYYY-MM-DD>.xlsx`

#### Scenario: Xuất PDF
- **WHEN** user bấm "Xuất PDF" ở 1 card
- **THEN** trình duyệt download file `.pdf` snapshot card đó (gồm chart + data), tên file dạng `bao-cao-<loai>-<YYYY-MM-DD>.pdf`

#### Scenario: Empty state cho Mock Test khi <2 mốc dữ liệu
- **WHEN** lớp filter có ít hơn 2 lần Mock Test
- **THEN** card hiện hint "Cần ít nhất 2 mốc Mock Test để vẽ tiến độ", disable nút xuất

## ADDED Requirements

### Requirement: ReportsPage có biểu đồ tiến độ bài tập
`ReportsPage` SHALL hiển thị một card "Tiến độ Bài Tập" vẽ số bài nộp so với số bài giao theo thời gian cho lớp đang chọn, dùng `homeworkService`/`hwAssignmentService`/`submissionService`, kèm nút xuất Excel/PDF và empty state khi lớp chưa có bài tập.

#### Scenario: Lớp có bài tập
- **WHEN** lớp đang chọn có bài tập đã giao
- **THEN** card hiển thị biểu đồ số bài nộp / số bài giao theo thời gian

#### Scenario: Lớp chưa có bài tập
- **WHEN** lớp đang chọn chưa có bài tập nào
- **THEN** card hiển thị empty state

### Requirement: Biểu đồ ReportsPage hỗ trợ drill-down chi tiết
Các biểu đồ trên `ReportsPage` SHALL hỗ trợ click vào một phần tử (vd cột của một tháng) để mở bảng chi tiết tương ứng trong `Modal`. Dữ liệu chi tiết SHALL được tính/truy vấn khi mở (lazy), không tính sẵn cho mọi phần tử.

#### Scenario: Drill-down từ biểu đồ điểm danh
- **WHEN** user click vào cột của một tháng trong card Điểm Danh
- **THEN** một modal mở ra hiển thị bảng chi tiết buổi học và trạng thái từng học sinh trong tháng đó

#### Scenario: Drill-down từ biểu đồ học phí
- **WHEN** user click vào cột của một tháng trong card Tổng thu Học Phí
- **THEN** một modal mở ra hiển thị danh sách học sinh kèm số đã đóng/còn nợ của tháng đó
