## 1. RadarChartPanel — fallback Bar Chart

- [ ] 1.1 Register thêm `BarController`, `CategoryScale`, `LinearScale`, `BarElement` cho Chart.js trong `RadarChartPanel.jsx`
- [ ] 1.2 Rẽ nhánh khi `skills.length < 3`: build grouped bar chart (trục X = tên kỹ năng, trục Y = 0–100%, mỗi đợt đánh giá = 1 dataset giữ nguyên `DATASET_COLORS`); giữ phép chuẩn hóa `value / maxScore * 100`
- [ ] 1.3 Giữ nguyên radar khi `skills.length >= 3`; kiểm tra cả hai nhánh render đúng (2 kỹ năng → bar, 4 kỹ năng → radar)

## 2. Tên giáo viên trong phiếu (ReviewsPage)

- [ ] 2.1 Thêm `const { teacher } = useAuth()` trong `ReviewsPage.jsx`
- [ ] 2.2 Truyền `teacherName={teacher?.name}` vào `ReviewForm` và `settings={{ ...settings, teacherName: teacher?.name }}` vào `ReportCardModal`
- [ ] 2.3 Tạo một đánh giá mới và kiểm tra phiếu hiển thị đúng tên giáo viên (không còn `—`)

## 3. ReportCardModal — maxScore từ scoreMax

- [ ] 3.1 Tính `const maxScore = latestReview?.scoreMax?.[skill.name] ?? 9` cho mỗi kỹ năng
- [ ] 3.2 Cập nhật `pct = Math.round((score / maxScore) * 100)` và hiển thị `{score}/{maxScore}`
- [ ] 3.3 Kiểm tra phiếu mới (có scoreMax) và phiếu cũ (fallback 9) hiển thị đúng

## 4. Xuất phiếu hàng loạt (zip)

- [ ] 4.1 `npm install jszip`
- [ ] 4.2 Tạo `src/components/reviews/BulkExportModal.jsx`: nhận danh sách học sinh + data, lọc học sinh có `latestReview != null` trong date range
- [ ] 4.3 Render từng card vào hidden div (`position:absolute; left:-9999px; top:0`), `html2canvas` → blob PNG → `zip.file('phieu-[ten].png', blob)` (lazy import `html2canvas` + `jszip`)
- [ ] 4.4 `zip.generateAsync({ type:'blob' })` → tải `phieu-[tenLop]-[ngay].zip`; modal progress "Đang tạo phiếu... n / tổng" + progress bar
- [ ] 4.5 Thêm nút "Xuất Tất Cả" ở header lớp trong `ReviewsPage.jsx`, load data bulk và mount `BulkExportModal`
- [ ] 4.6 Kiểm tra xuất zip với lớp nhiều học sinh; xác nhận học sinh không có đánh giá bị bỏ qua

## 5. Hoàn tất

- [ ] 5.1 `npm run build` chạy sạch (không lỗi import/bundle)
- [ ] 5.2 Cập nhật `CLAUDE.md`/`README.md` nếu có thay đổi đáng ghi (model đánh giá / dependency `jszip`)
- [ ] 5.3 Xóa `pending-fixes.md` sau khi cả 4 mục đã thực thi
