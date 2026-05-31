## 1. Data Layer

- [ ] 1.1 Thêm `phf_general_comments` vào danh sách storage keys trong `db.js` (default `[]`)
- [ ] 1.2 Định nghĩa type/shape `GeneralComment` trong comments hoặc jsdoc: `{ id, studentId, classId, text, updatedAt }`
- [ ] 1.3 Thêm helper `getGeneralComment(studentId, classId)` — find by composite key hoặc return null
- [ ] 1.4 Thêm helper `upsertGeneralComment(studentId, classId, text)` — find-or-create, update `text` + `updatedAt`
- [ ] 1.5 Thêm helper `getAttendanceByRange(studentId, classId, fromDate, toDate)` — filter + sort DESC
- [ ] 1.6 Thêm helper `getHomeworkByRange(classId, fromDate, toDate)` — filter assignedAt trong range + sort DESC

## 2. Component — DateRangeFilter

- [ ] 2.1 Tạo `src/components/reviews/DateRangeFilter.jsx` — 2 input[type=date]: fromDate, toDate; props: `value={fromDate, toDate}`, `onChange`
- [ ] 2.2 Default values: fromDate = ngày đầu tháng hiện tại, toDate = hôm nay (khởi tạo tại ReviewsPage)
- [ ] 2.3 Validate fromDate ≤ toDate — hiển thị lỗi inline nếu vi phạm, không gọi onChange

## 3. Component — AttendancePanel

- [ ] 3.1 Tạo `src/components/reviews/AttendancePanel.jsx` — props: `studentId, classId, dateRange`
- [ ] 3.2 Gọi `getAttendanceByRange` với props, hiển thị danh sách buổi (date + trạng thái Có mặt/Vắng + note)
- [ ] 3.3 Tính và hiển thị "X/Y buổi — Z% chuyên cần" ở header panel
- [ ] 3.4 Empty state khi không có data trong dateRange

## 4. Component — HomeworkPanel

- [ ] 4.1 Tạo `src/components/reviews/HomeworkPanel.jsx` — props: `studentId, classId, dateRange`
- [ ] 4.2 Gọi `getHomeworkByRange(classId, fromDate, toDate)`, với mỗi homework lookup Submission của studentId
- [ ] 4.3 Hiển thị danh sách bài tập: tên + trạng thái nộp (Đã nộp/Chưa nộp) + điểm (nếu có)
- [ ] 4.4 Tính và hiển thị "X/Y bài — Z% hoàn thành" ở header panel
- [ ] 4.5 Empty state khi không có bài tập trong dateRange

## 5. Component — GeneralCommentPanel

- [ ] 5.1 Tạo `src/components/reviews/GeneralCommentPanel.jsx` — props: `studentId, classId`
- [ ] 5.2 Load `getGeneralComment(studentId, classId)` khi mount hoặc khi studentId/classId thay đổi, prefill textarea
- [ ] 5.3 Debounce auto-save 800ms: gọi `upsertGeneralComment` sau khi user ngừng gõ
- [ ] 5.4 Hiển thị indicator "Đã lưu" 1.5s sau khi save thành công, rồi ẩn

## 6. Component — ClassOverviewTable

- [ ] 6.1 Tạo `src/components/reviews/ClassOverviewTable.jsx` — props: `classId, dateRange`
- [ ] 6.2 Lấy danh sách học viên active của classId, render 1 hàng/học viên
- [ ] 6.3 Tính `attendancePct` và `homeworkPct` per student (reuse logic từ AttendancePanel/HomeworkPanel)
- [ ] 6.4 Lấy `latestReview` per student trong dateRange: hiển thị `remark` hoặc `tags[0]` hoặc "—"
- [ ] 6.5 Empty state khi lớp chưa chọn hoặc không có học viên

## 7. Component — ClassPdfExport

- [ ] 7.1 Thêm nút "Xuất PDF Lớp" vào ClassOverviewTable (hoặc header overview)
- [ ] 7.2 Khi click: loop qua từng học viên, render `<ReportCardContent />` vào off-screen div
- [ ] 7.3 Sau mỗi render, `await setTimeout(100)` rồi `html2canvas(div, { scale: 2 })` → canvas
- [ ] 7.4 Tạo jsPDF doc, `doc.addImage(canvas)` cho từng học viên, `doc.addPage()` giữa các trang
- [ ] 7.5 Hiển thị progress "Đang xử lý X/Y học viên" trong loading state
- [ ] 7.6 `doc.save("nhan-xet-lop-<className>-<fromDate>-<toDate>.pdf")` sau khi xong

## 8. ReportCardModal — cập nhật layout

- [ ] 8.1 Thêm props: `dateRange`, `attendancePct`, `homeworkPct`, `generalComment` vào ReportCardModal
- [ ] 8.2 Thêm dòng "Khoảng thời gian: DD/MM/YYYY – DD/MM/YYYY" vào layout phiếu
- [ ] 8.3 Thêm stats row "Chuyên cần: X% | Bài tập: Y%" (hiển thị "—" nếu không có data)
- [ ] 8.4 Thêm section "Nhận Xét Tổng Kết" bên dưới lời khuyên — chỉ render khi `generalComment` không rỗng

## 9. ReviewsPage — tích hợp

- [ ] 9.1 Thêm state `viewMode` ("individual" | "overview") vào ReviewsPage
- [ ] 9.2 Thêm state `dateRange` (`{ fromDate, toDate }`) với default (đầu tháng → hôm nay)
- [ ] 9.3 Tạo `ViewModeToggle` component hoặc inline 2 nút toggle [Cá Nhân | Tổng Quan Lớp]
- [ ] 9.4 Render `DateRangeFilter` và `ViewModeToggle` ở top bar, hiển thị trong cả 2 mode
- [ ] 9.5 Chế độ Cá Nhân: thêm `AttendancePanel`, `HomeworkPanel`, `GeneralCommentPanel` vào layout sau RadarChartPanel/ReviewHistory
- [ ] 9.6 Chế độ Tổng Quan: ẩn ReviewSelector + individual panels, hiển thị `ClassOverviewTable` full width
- [ ] 9.7 Truyền `dateRange` xuống `AttendancePanel`, `HomeworkPanel`, `ReviewHistory`, `ClassOverviewTable`, `ReportCardModal`
- [ ] 9.8 Tính `attendancePct` + `homeworkPct` + load `generalComment` tại ReviewsPage để truyền vào ReportCardModal

## 10. Verification

- [ ] 10.1 Test DateRangeFilter: thay đổi range → tất cả panels cập nhật
- [ ] 10.2 Test AttendancePanel: kiểm tra % chuyên cần tính đúng, empty state
- [ ] 10.3 Test HomeworkPanel: kiểm tra % hoàn thành tính đúng, empty state
- [ ] 10.4 Test GeneralCommentPanel: auto-save debounce, chuyển học viên reset textarea
- [ ] 10.5 Test toggle Cá Nhân ↔ Tổng Quan: panels hiển thị/ẩn đúng
- [ ] 10.6 Test ClassOverviewTable: % tính đúng, nhận xét gần nhất hiển thị
- [ ] 10.7 Test ClassPdfExport: PDF tạo thành công với đúng số trang
- [ ] 10.8 Test ReportCardModal cá nhân: khoảng ngày, stats, nhận xét chung xuất hiện đúng trong phiếu
