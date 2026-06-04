## 1. Skeleton loading

- [ ] 1.1 `FeesPage`: thay loading text bằng `<Skeleton>` cho header + bảng (A1)
- [ ] 1.2 `ReviewsPage`: thêm `<Skeleton>` cho từng panel (radar, lịch sử, điểm danh %, bài tập %) (A2)
- [ ] 1.3 `MockTestTab`: thêm `<Skeleton>` cho sidebar học sinh + vùng nội dung khi load (A3)

## 2. Breadcrumb / back ClassDetailPage

- [ ] 2.1 Thêm breadcrumb "Lớp học / {tên lớp}" ở header `ClassDetailPage/index.jsx` (E1)
- [ ] 2.2 Phần "Lớp học" click → set `page='classes'`, clear `selectedClassId`; xác minh hoạt động khi vào từ Dashboard/Schedule

## 3. Bỏ GeneralCommentPanel

- [ ] 3.1 Gỡ import + render `<GeneralCommentPanel />` khỏi `ReviewsPage` (C4)
- [ ] 3.2 Giữ nguyên file `GeneralCommentPanel.jsx` và `generalCommentService` (không xóa)

## 4. Kiểm thử

- [ ] 4.1 Test loading: reload từng trang, xác nhận hiển thị skeleton không còn text "Đang tải..."
- [ ] 4.2 Test breadcrumb từ Dashboard và Schedule → về list lớp đúng
- [ ] 4.3 Test `ReviewsPage` không còn panel nhận xét chung; các panel khác hoạt động bình thường
