## 1. Bộ chọn lớp chung (C5)

- [ ] 1.1 Lift `selectedClassId` lên `ReportsPage`, render bộ chọn lớp chung ở đầu trang
- [ ] 1.2 Truyền lớp đang chọn xuống tất cả card; bỏ selector lớp riêng từng card
- [ ] 1.3 Giữ filter khoảng tháng / chọn học viên cục bộ ở card nếu cần

## 2. Bỏ giới hạn 5 HS Mock Test (C2)

- [ ] 2.1 Bỏ `slice(0,5)` trong MockTestCard, render toàn bộ học sinh
- [ ] 2.2 Dùng legend Chart.js để ẩn/hiện series, tránh rối khi đông

## 3. Biểu đồ tiến độ bài tập (C6)

- [ ] 3.1 Tạo card "Tiến độ Bài Tập" dùng `hwAssignmentService` + `submissionService`
- [ ] 3.2 Vẽ số bài nộp / số bài giao theo thời gian cho lớp đang chọn
- [ ] 3.3 Gắn `ExportButtons` + empty state khi lớp chưa có bài tập

## 4. Drill-down biểu đồ (H1)

- [ ] 4.1 Cấu hình `options.onClick` (getElementsAtEventForMode) cho biểu đồ điểm danh + học phí
- [ ] 4.2 Mở `Modal` bảng chi tiết, tính dữ liệu lazy khi mở
- [ ] 4.3 Điểm danh: bảng buổi + trạng thái HS của tháng; Học phí: danh sách HS + đã đóng/nợ tháng

## 5. Kiểm thử

- [ ] 5.1 Test đổi lớp chung refresh mọi card; filter cục bộ chỉ ảnh hưởng card đó
- [ ] 5.2 Test Mock Test hiển thị >5 HS, legend toggle hoạt động
- [ ] 5.3 Test biểu đồ bài tập với lớp có/không có bài tập
- [ ] 5.4 Test drill-down mở đúng bảng chi tiết tháng được click
- [ ] 5.5 Cập nhật `CLAUDE.md`/`README.md` mô tả ReportsPage mới
