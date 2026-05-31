## 1. Data Layer

- [ ] 1.1 Thêm helper `getReviewsByStudent(studentId, classId)` vào `db.js` — filter + sort by date DESC
- [ ] 1.2 Cập nhật `upsertReview` để hỗ trợ fields mới: `readScore`, `listenScore`, `tags`, `advice`, `teacherName`
- [ ] 1.3 Verify backward compatibility: records cũ không có fields mới vẫn hoạt động

## 2. Components — Radar Chart

- [ ] 2.1 Tạo `src/components/reviews/RadarChartPanel.jsx` — chart.js radar type, 4 trục (Nghe/Nói/Đọc/Viết), scale 0-9
- [ ] 2.2 Overlay nhiều datasets (mỗi đợt đánh giá = 1 đường màu khác), legend hiển thị tháng/năm
- [ ] 2.3 Empty state khi chưa có đánh giá: radar trống + CTA "Tạo Đánh Giá Đầu Tiên"

## 3. Components — Quick Tag Editor

- [ ] 3.1 Tạo `src/components/reviews/QuickTagEditor.jsx` — 2 nhóm nhãn pill buttons (tích cực xanh + cần cố gắng vàng)
- [ ] 3.2 Danh sách tags mặc định: 5 tích cực + 5 cần cố gắng (hardcoded config array)
- [ ] 3.3 Toggle logic: click chọn/bỏ chọn, active state highlight
- [ ] 3.4 Preview tổng hợp: hiển thị câu nhận xét tự nhiên từ tags đã chọn

## 4. Components — Review Form

- [ ] 4.1 Tạo `src/components/reviews/ReviewForm.jsx` — modal form chấm điểm 4 kỹ năng (0-9)
- [ ] 4.2 Fields: date (required), listenScore, speakScore, readScore, writeScore, tags, advice, remark
- [ ] 4.3 Tích hợp QuickTagEditor trong form
- [ ] 4.4 Validation: điểm 0-9, date bắt buộc
- [ ] 4.5 Mode thêm/sửa: prefill data khi sửa, gọi `upsertReview`

## 5. Components — Review History

- [ ] 5.1 Tạo `src/components/reviews/ReviewHistory.jsx` — timeline nhận xét cũ, sort date DESC
- [ ] 5.2 Mỗi entry hiển thị: ngày, điểm 4 kỹ năng (badges), tags, remark snippet
- [ ] 5.3 Click entry → callback mở ReviewForm mode sửa
- [ ] 5.4 Empty state: "Chưa có nhận xét nào"

## 6. Components — Report Card

- [ ] 6.1 Tạo `src/components/reviews/ReportCardModal.jsx` — modal preview phiếu kết quả
- [ ] 6.2 Layout phiếu: header (centerName), thông tin HV, radar chart, bảng điểm, tags, lời khuyên, footer (teacherName, date)
- [ ] 6.3 Nút "Tải Ảnh": `html2canvas` scale 2 → download PNG
- [ ] 6.4 Nút "Tải PDF": `html2canvas` → `jspdf` → download PDF
- [ ] 6.5 Disable nút khi chưa có đánh giá + tooltip

## 7. Components — Review Selector

- [ ] 7.1 Tạo `src/components/reviews/ReviewSelector.jsx` — chọn lớp (pills/dropdown) + danh sách học viên
- [ ] 7.2 Filter học viên theo tên (search input, debounce 200ms)
- [ ] 7.3 Highlight học viên đang chọn, callback onSelect

## 8. Page Assembly — ReviewsPage

- [ ] 8.1 Tạo `src/pages/ReviewsPage.jsx` — compose ReviewSelector + RadarChartPanel + QuickReviewPanel + ReviewHistory
- [ ] 8.2 State management: selectedClassId, selectedStudentId, reviewFormOpen, editingReview
- [ ] 8.3 Layout responsive: desktop = 2 cột (radar | tags+form), mobile = 1 cột xếp dọc
- [ ] 8.4 Nút "Xuất Phiếu Gửi Phụ Huynh" → mở ReportCardModal

## 9. Integration

- [ ] 9.1 Cập nhật `App.jsx` — import `ReviewsPage` thay vì placeholder, pass props (year, month)
- [ ] 9.2 Cập nhật `PlaceholderPages.jsx` — loại bỏ export `ReviewsPage`
- [ ] 9.3 Seed demo review data trong `seedDemoData()` — thêm 2-3 reviews cho học viên demo

## 10. Verification

- [ ] 10.1 Test chọn lớp → chọn học viên → hiển thị radar chart
- [ ] 10.2 Test tạo/sửa đánh giá kỹ năng qua ReviewForm
- [ ] 10.3 Test QuickTagEditor: chọn/bỏ tags, preview tổng hợp
- [ ] 10.4 Test xuất Report Card (PNG + PDF)
- [ ] 10.5 Test responsive mobile layout
- [ ] 10.6 Test backward compatibility với review records cũ
