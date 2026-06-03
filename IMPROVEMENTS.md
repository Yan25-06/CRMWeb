# Danh sách cải thiện cần làm

## A. UX / Loading states

| # | Chỗ | Vấn đề |
|---|-----|--------|
| A1 | `FeesPage` | Loading state dùng text thay vì `<Skeleton>` |
| A2 | `ReviewsPage` — tất cả các panel | Không có skeleton khi load dữ liệu |
| A3 | `MockTestTab` | Đang không có `<Skeleton>` khi load mock test |

## B. Dashboard

| # | Chỗ | Vấn đề |
|---|-----|--------|
| B1 | Dashboard | Không có card "Lịch hôm nay" (buổi học trong ngày) |
| B2 | Dashboard | Stat card "Năm học" vô nghĩa — nên thay bằng số HS chưa đóng phí hoặc buổi học tuần này |

## C. Tính năng còn thiếu / bỏ dở

| # | Chỗ | Vấn đề |
|---|-----|--------|
| C1 | `FeesPage` | Không có nút xuất Excel/PDF cho bảng học phí tháng hiện tại |
| C2 | `ReportsPage → MockTestCard` | Giới hạn cứng 5 học sinh (`slice(0,5)`) khi xem tất cả |
| C3 | `ReviewsPage → ClassOverviewTable` | Thêm 2 cột: (1) điểm mock test gần nhất, (2) chênh lệch điểm so với lần mock trước |
| C4 | `ReviewsPage → GeneralCommentPanel` | Bỏ tab nhận xét chung (xóa `<GeneralCommentPanel />`) |
| C5 | `ReportsPage` | Thêm phần chọn lớp chung ở đầu trang cho tất cả biểu đồ, thay vì mỗi card có selector riêng |
| C6 | `ReportsPage` | Thêm 1 biểu đồ về tiến độ bài tập (số bài nộp / số bài giao (homeworks) theo thời gian) |

## D. Auth / Onboarding

| # | Chỗ | Vấn đề |
|---|-----|--------|
| D1 | `SetPasswordPage` | Khi giáo viên accept invite, chỉ có form đặt mật khẩu — chưa có ô nhập tên. Cần thêm input tên và lưu vào bảng `teachers` khi hoàn tất |
| D2 | Toàn bộ web | Những chỗ hiện đang hiện email giáo viên (Navbar, Settings, v.v.) cần thay bằng `teacher.name` từ `useAuth()`, khi nào không có tên thì mới hiện email |

## E. Nhỏ / polish

| # | Chỗ | Vấn đề |
|---|-----|--------|
| E1 | `ClassDetailPage` | Không có breadcrumb/back rõ ràng khi navigate từ Dashboard |
| E2 | `Sidebar` | Đưa page lớp học và học viên lên trên, sau dashboard, vì đây là 2 page dùng nhiều nhất |


