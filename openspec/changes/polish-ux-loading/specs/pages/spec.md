## ADDED Requirements

### Requirement: Trạng thái tải dùng skeleton trên FeesPage, ReviewsPage và MockTestTab
`FeesPage`, `ReviewsPage` (tất cả panel) và `MockTestTab` trong `ClassDetailPage` SHALL hiển thị `<Skeleton>` từ `@/components/ui` trong khi chờ dữ liệu, thay vì text "Đang tải...".

#### Scenario: FeesPage đang tải
- **WHEN** `FeesPage` đang chờ service trả dữ liệu học phí
- **THEN** trang hiển thị skeleton cho header và bảng, rồi swap sang nội dung khi dữ liệu resolve

#### Scenario: ReviewsPage đang tải
- **WHEN** `ReviewsPage` đang load dữ liệu cho các panel (radar, lịch sử, điểm danh %, bài tập %)
- **THEN** mỗi panel hiển thị skeleton tương ứng, rồi swap sang nội dung khi resolve

#### Scenario: MockTestTab đang tải
- **WHEN** `MockTestTab` đang load danh sách mock test
- **THEN** sidebar học sinh và vùng nội dung hiển thị skeleton, rồi swap sang nội dung khi resolve

### Requirement: ClassDetailPage có breadcrumb điều hướng trở lại rõ ràng
`ClassDetailPage` SHALL hiển thị breadcrumb "Lớp học / {tên lớp}" ở header, trong đó phần "Lớp học" click được để quay về danh sách lớp, hoạt động bất kể trang được mở từ đâu (Dashboard, Schedule hay danh sách lớp).

#### Scenario: Quay lại từ ClassDetailPage mở từ Dashboard
- **WHEN** giáo viên mở một lớp từ Dashboard rồi bấm "Lớp học" trên breadcrumb
- **THEN** ứng dụng quay về danh sách lớp (`ClassesOverviewPage`)

#### Scenario: Breadcrumb hiển thị tên lớp hiện tại
- **WHEN** giáo viên đang ở `ClassDetailPage`
- **THEN** breadcrumb hiển thị "Lớp học / {tên lớp}" với tên lớp hiện tại

### Requirement: ReviewsPage không hiển thị panel nhận xét chung
`ReviewsPage` SHALL không còn render panel/tab nhận xét chung (`GeneralCommentPanel`). Service `generalCommentService` và file component SHALL được giữ nguyên, chỉ gỡ phần render khỏi UI.

#### Scenario: Mở ReviewsPage
- **WHEN** giáo viên mở `ReviewsPage`
- **THEN** không có panel/tab nhận xét chung nào được hiển thị
