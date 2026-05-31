## 1. Data Layer

- [x] 1.1 Thêm helper `getReviewsByStudent(studentId, classId)` vào `db.js` — filter + sort by date DESC
- [x] 1.2 Cập nhật `upsertReview` để hỗ trợ fields mới: `readScore`, `listenScore`, `tags`, `advice`, `teacherName`
- [x] 1.3 Verify backward compatibility: records cũ không có fields mới vẫn hoạt động

## 2. Components — Radar Chart

- [x] 2.1 Tạo `src/components/reviews/RadarChartPanel.jsx` — chart.js radar type, 4 trục (Nghe/Nói/Đọc/Viết), scale 0-9
- [x] 2.2 Overlay nhiều datasets (mỗi đợt đánh giá = 1 đường màu khác), legend hiển thị tháng/năm
- [x] 2.3 Empty state khi chưa có đánh giá: radar trống + CTA "Tạo Đánh Giá Đầu Tiên"

## 3. Components — Quick Tag Editor

- [x] 3.1 Tạo `src/components/reviews/QuickTagEditor.jsx` — 2 nhóm nhãn pill buttons (tích cực xanh + cần cố gắng vàng)
- [x] 3.2 Danh sách tags mặc định: 5 tích cực + 5 cần cố gắng (hardcoded config array)
- [x] 3.3 Toggle logic: click chọn/bỏ chọn, active state highlight
- [x] 3.4 Preview tổng hợp: hiển thị câu nhận xét tự nhiên từ tags đã chọn

## 4. Components — Review Form

- [x] 4.1 Tạo `src/components/reviews/ReviewForm.jsx` — modal form chấm điểm 4 kỹ năng (0-9)
- [x] 4.2 Fields: date (required), listenScore, speakScore, readScore, writeScore, tags, advice, remark
- [x] 4.3 Tích hợp QuickTagEditor trong form
- [x] 4.4 Validation: điểm 0-9, date bắt buộc
- [x] 4.5 Mode thêm/sửa: prefill data khi sửa, gọi `upsertReview`

## 5. Components — Review History

- [x] 5.1 Tạo `src/components/reviews/ReviewHistory.jsx` — timeline nhận xét cũ, sort date DESC
- [x] 5.2 Mỗi entry hiển thị: ngày, điểm 4 kỹ năng (badges), tags, remark snippet
- [x] 5.3 Click entry → callback mở ReviewForm mode sửa
- [x] 5.4 Empty state: "Chưa có nhận xét nào"

## 6. Components — Report Card

- [x] 6.1 Tạo `src/components/reviews/ReportCardModal.jsx` — modal preview phiếu kết quả
- [x] 6.2 Layout phiếu: header (centerName), thông tin HV, radar chart, bảng điểm, tags, lời khuyên, footer (teacherName, date)
- [x] 6.3 Nút "Tải Ảnh": `html2canvas` scale 2 → download PNG
- [x] 6.4 Nút "Tải PDF": `html2canvas` → `jspdf` → download PDF
- [x] 6.5 Disable nút khi chưa có đánh giá + tooltip

## 7. Components — Review Selector

- [x] 7.1 Tạo `src/components/reviews/ReviewSelector.jsx` — chọn lớp (pills/dropdown) + danh sách học viên
- [x] 7.2 Filter học viên theo tên (search input, debounce 200ms)
- [x] 7.3 Highlight học viên đang chọn, callback onSelect

## 8. Page Assembly — ReviewsPage

- [x] 8.1 Tạo `src/pages/ReviewsPage.jsx` — compose ReviewSelector + RadarChartPanel + QuickReviewPanel + ReviewHistory
- [x] 8.2 State management: selectedClassId, selectedStudentId, reviewFormOpen, editingReview
- [x] 8.3 Layout responsive: desktop = 2 cột (radar | tags+form), mobile = 1 cột xếp dọc
- [x] 8.4 Nút "Xuất Phiếu Gửi Phụ Huynh" → mở ReportCardModal

## 9. Integration

- [x] 9.1 Cập nhật `App.jsx` — import `ReviewsPage` thay vì placeholder, pass props (year, month)
- [x] 9.2 Cập nhật `PlaceholderPages.jsx` — loại bỏ export `ReviewsPage`
- [x] 9.3 Seed demo review data trong `seedDemoData()` — thêm 2-3 reviews cho học viên demo

## 10. Verification

- [x] 10.1 Test chọn lớp → chọn học viên → hiển thị radar chart
- [x] 10.2 Test tạo/sửa đánh giá kỹ năng qua ReviewForm
- [x] 10.3 Test QuickTagEditor: chọn/bỏ tags, preview tổng hợp
- [x] 10.4 Test xuất Report Card (PNG + PDF)
- [x] 10.5 Test responsive mobile layout
- [x] 10.6 Test backward compatibility với review records cũ
