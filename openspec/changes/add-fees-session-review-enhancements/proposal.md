## Why

Ba thao tác lặp lại hàng ngày của giáo viên đang tốn nhiều click thừa: lọc học phí khi trung tâm có nhiều lớp, sửa lại giờ mỗi khi tạo buổi học (dù lớp đã set lịch cố định), và gõ lại điểm/nhận xét vào form đánh giá dù học sinh vừa thi mock test. Ba cải tiến nhỏ, độc lập này loại bỏ công việc thủ công đó.

## What Changes

- **Lọc học phí theo lớp**: `FeesPage` thêm bộ chọn lớp (dropdown), lọc client-side trên dữ liệu `buildFeesRows` đã có sẵn `className`. Kết hợp với bộ lọc trạng thái thanh toán hiện có và áp dụng cho cả xuất Excel.
- **Giờ buổi học mặc định theo lịch lớp**: Khi tạo buổi học mới, `SessionModal` parse `scheduleTime` của lớp (dạng `"19:00-20:30"`) để điền sẵn giờ bắt đầu/kết thúc thay vì hardcode `08:00`/`09:30`. Fallback về giá trị mặc định khi không parse được. Chế độ sửa buổi học không đổi.
- **Tự động điền form đánh giá từ mock test gần nhất**: Khi tạo đánh giá mới, `ReviewForm` điền sẵn điểm kỹ năng (`scores`) và nhận xét thêm (`remark`) từ mock test gần nhất của học sinh, kèm badge "Điền từ [tên test]" có nút xóa để bỏ dữ liệu đã điền. Chế độ sửa đánh giá không đổi.

## Capabilities

### New Capabilities
<!-- Không có capability mới — đều là cải tiến hành vi trên các trang/form hiện có -->

### Modified Capabilities
- `pages`: Bổ sung yêu cầu lọc học phí theo lớp cho `FeesPage`; bổ sung yêu cầu giờ mặc định theo lịch lớp khi tạo buổi học; bổ sung yêu cầu tự động điền điểm và nhận xét cho `ReviewForm` từ mock test gần nhất.

## Impact

- **FeesPage** (`src/pages/FeesPage.jsx`): thêm state + UI dropdown lọc lớp, áp dụng vào danh sách hiển thị và dữ liệu xuất Excel.
- **SessionModal** (`src/components/classes/SessionModal.jsx`): nhận prop `scheduleTime`, parse giờ; **AttendanceTab** + **HomeworkTab** (`src/pages/ClassDetailPage/tabs/`) truyền prop xuống; **ClassDetailPage** (`src/pages/ClassDetailPage/index.jsx`) truyền `scheduleTime` của lớp vào 2 tab.
- **ReviewForm** (`src/components/reviews/ReviewForm.jsx`): nhận prop dữ liệu mock test gần nhất, pre-fill khi create; **ReviewsPage** (`src/pages/ReviewsPage.jsx`) tính và truyền entry mock gần nhất (đã có sẵn `mocksByStudent`).
- Không thay đổi schema DB, service layer, hay routing. Thuần client-side UI.
