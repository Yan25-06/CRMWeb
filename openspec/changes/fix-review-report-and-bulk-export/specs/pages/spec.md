## MODIFIED Requirements

### Requirement: Biểu đồ năng lực vẽ trục động và chuẩn hóa điểm
`RadarChartPanel` SHALL vẽ các trục theo `skillConfig` của lớp và chuẩn hóa điểm về phần trăm (`value / maxScore * 100`) để các kỹ năng khác thang điểm vẫn so sánh được trên cùng biểu đồ. `maxScore` mỗi kỹ năng SHALL lấy từ `review.scoreMax[skillName]` (snapshot lưu trong phiếu), fallback về `9` khi không có. Khi lớp có **dưới 3 kỹ năng** (`skills.length < 3`), `RadarChartPanel` SHALL render **grouped bar chart** thay vì radar (radar 2 trục chỉ là đường thẳng, vô nghĩa): trục X là tên các kỹ năng, trục Y là phần trăm 0–100 dùng cùng phép chuẩn hóa, mỗi đợt đánh giá là một dataset giữ nguyên màu của radar. Từ 3 kỹ năng trở lên SHALL giữ nguyên radar.

#### Scenario: Trục biểu đồ khớp kỹ năng của lớp
- **WHEN** xem biểu đồ năng lực của học viên trong một lớp tùy chỉnh kỹ năng có từ 3 kỹ năng trở lên
- **THEN** các trục radar khớp đúng các kỹ năng trong `skillConfig` của lớp

#### Scenario: Chuẩn hóa điểm khác thang
- **WHEN** các kỹ năng có `maxScore` khác nhau (lấy từ `review.scoreMax`)
- **THEN** biểu đồ vẽ theo phần trăm trên trục 0–100 và tooltip hiển thị cả điểm gốc lẫn phần trăm

#### Scenario: Lớp dưới 3 kỹ năng dùng bar chart
- **WHEN** xem biểu đồ năng lực của học viên trong lớp chỉ có 2 (hoặc ít hơn) kỹ năng
- **THEN** hệ thống render grouped bar chart với trục X là tên kỹ năng, trục Y 0–100%, mỗi đợt đánh giá là một nhóm cột giữ nguyên màu

## ADDED Requirements

### Requirement: ReportCardModal hiển thị đúng thang điểm và tên giáo viên
`ReportCardModal` SHALL hiển thị thang điểm tối đa mỗi kỹ năng lấy từ `latestReview.scoreMax[skill.name]`, fallback về `9` khi không có, và dùng chính nguồn này để tính phần trăm (`score / maxScore * 100`) lẫn hiển thị dạng `{score}/{maxScore}`. Tên giáo viên trên phiếu SHALL lấy từ tài khoản đăng nhập hiện tại (`useAuth().teacher.name`) do `ReviewsPage` truyền xuống, không lấy từ `settings.teacherName` (đã bỏ khỏi service layer).

#### Scenario: Bảng điểm dùng thang từ scoreMax
- **WHEN** mở phiếu kết quả của học sinh có `latestReview.scoreMax` cho từng kỹ năng
- **THEN** mỗi dòng kỹ năng hiển thị `{score}/{maxScore}` và phần trăm tính theo `maxScore` tương ứng

#### Scenario: Phiếu cũ không có scoreMax
- **WHEN** mở phiếu của một đánh giá cũ không có `scoreMax` cho kỹ năng
- **THEN** hệ thống dùng thang mặc định `9` để hiển thị và tính phần trăm

#### Scenario: Tên giáo viên hiển thị đúng
- **WHEN** mở phiếu kết quả khi đã đăng nhập bằng tài khoản giáo viên có tên hiển thị
- **THEN** phiếu hiển thị tên giáo viên đó thay vì `—`

### Requirement: ReviewsPage xuất phiếu hàng loạt thành file zip
`ReviewsPage` SHALL cung cấp nút "Xuất Tất Cả" cho phép xuất phiếu kết quả dạng ảnh PNG của tất cả học sinh **có ít nhất một đánh giá trong kỳ date range đang lọc** thành một file `.zip`. Hệ thống SHALL render từng phiếu tuần tự (off-screen), chuyển thành PNG qua `html2canvas`, đóng gói bằng `jszip` (cả hai lazy import trong handler), và hiển thị modal progress dạng "Đang tạo phiếu... n / tổng" kèm thanh tiến trình trong suốt quá trình. Tên file zip SHALL theo dạng `phieu-[tenLop]-[ngay].zip` và mỗi ảnh trong zip theo dạng `phieu-[tenHocSinh].png`.

#### Scenario: Xuất phiếu cả lớp
- **WHEN** giáo viên bấm "Xuất Tất Cả" ở một lớp có nhiều học sinh có đánh giá trong kỳ lọc
- **THEN** hệ thống render từng phiếu, hiển thị progress, và tải xuống một file zip chứa các ảnh PNG đặt tên theo từng học sinh

#### Scenario: Bỏ qua học sinh không có đánh giá
- **WHEN** trong lớp có học sinh chưa có đánh giá nào trong kỳ date range đang lọc
- **THEN** học sinh đó không có phiếu trong file zip
