## ADDED Requirements

### Requirement: Dashboard hiển thị card "Lịch hôm nay" có điều hướng tới điểm danh
`DashboardPage` SHALL hiển thị card "Lịch hôm nay" liệt kê các buổi học trong ngày (tên lớp, giờ, số học sinh active). Mỗi buổi SHALL có hành động điều hướng thẳng tới trang điểm danh của lớp đó (`ClassDetailPage` tab Attendance).

#### Scenario: Có buổi học hôm nay
- **WHEN** giáo viên mở Dashboard và hôm nay có buổi học theo lịch
- **THEN** card "Lịch hôm nay" liệt kê từng buổi với tên lớp, giờ và số học sinh active

#### Scenario: Điều hướng tới điểm danh
- **WHEN** giáo viên bấm vào hành động điểm danh của một buổi trong card "Lịch hôm nay"
- **THEN** ứng dụng mở `ClassDetailPage` của lớp đó ở tab Attendance

#### Scenario: Hôm nay không có buổi học
- **WHEN** giáo viên mở Dashboard và hôm nay không có buổi học nào
- **THEN** card "Lịch hôm nay" hiển thị empty state

### Requirement: Dashboard thay stat "Năm học" bằng số HS chưa đóng phí
`DashboardPage` SHALL thay stat card "Năm học" bằng card "HS chưa đóng phí tháng này" hiển thị số học sinh còn nợ học phí của tháng hiện tại, tính bằng cùng công thức học phí mà `FeesPage` dùng. Card SHALL điều hướng tới `FeesPage` khi được bấm.

#### Scenario: Hiển thị số HS chưa đóng phí
- **WHEN** giáo viên mở Dashboard
- **THEN** card hiển thị số học sinh còn nợ học phí của tháng hiện tại thay cho stat "Năm học"

#### Scenario: Điều hướng tới trang học phí
- **WHEN** giáo viên bấm card "HS chưa đóng phí tháng này"
- **THEN** ứng dụng chuyển sang `FeesPage`
