## 1. Lọc học phí theo lớp (FeesPage)

- [ ] 1.1 Thêm state `classFilter` (mặc định `'all'`) và tính danh sách `className` duy nhất từ `rows`
- [ ] 1.2 Thêm `Select` từ `@/components/ui` với option "Tất cả lớp" + các lớp; đặt cạnh tabs trạng thái
- [ ] 1.3 Áp dụng lọc lớp trước lọc trạng thái; cập nhật `filteredRows`, `tabCounts` và summary cards theo tập đã lọc lớp
- [ ] 1.4 Đảm bảo `exportRows` (xuất Excel) phản ánh cả lọc lớp lẫn lọc trạng thái

## 2. Giờ buổi học mặc định theo lịch lớp

- [ ] 2.1 `SessionModal` nhận prop `scheduleTime`; thêm hàm parse `"HH:MM-HH:MM"` → `{ start, end }`, fallback `08:00`/`09:30`
- [ ] 2.2 Trong nhánh create của `useEffect`, dùng giờ parse được để khởi tạo `startTime`/`endTime`; nhánh edit giữ nguyên
- [ ] 2.3 `ClassDetailPage/index.jsx` truyền `scheduleTime={currentClass?.scheduleTime}` vào `AttendanceTab` và `HomeworkTab`
- [ ] 2.4 `AttendanceTab` + `HomeworkTab` nhận prop `scheduleTime` và truyền tiếp vào `SessionModal`

## 3. Tự động điền form đánh giá từ mock test gần nhất

- [ ] 3.1 `ReviewsPage` tính `latestMockEntry = mocksByStudent.get(selectedStudentId)?.[0] ?? null` và truyền vào `ReviewForm`
- [ ] 3.2 `ReviewForm` nhận prop `latestMockEntry`; thêm state `prefillSource`
- [ ] 3.3 Trong nhánh create của `useEffect`: pre-fill `scores` (chỉ skill name khớp `skillConfig`) + `remark` từ `latestMockEntry`, set `prefillSource`
- [ ] 3.4 Render badge "Điền từ [tên test]" với nút xóa → reset form về `EMPTY_FORM` và clear `prefillSource`
- [ ] 3.5 Đảm bảo nhánh edit không bị ảnh hưởng và học sinh chưa có mock test mở form trống bình thường

## 4. Kiểm thử & tài liệu

- [ ] 4.1 Chạy `npm run build` xác nhận build sạch
- [ ] 4.2 Cập nhật `CLAUDE.md` (mục FeesPage / ClassDetailPage / ReviewForm) nếu hành vi mô tả thay đổi
