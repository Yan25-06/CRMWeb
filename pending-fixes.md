# Pending Fixes

Danh sách các lỗi/cải tiến nhỏ chờ thực thi cùng một lượt.

---

## [1] RadarChartPanel — fallback Bar Chart khi < 3 kỹ năng

**Vấn đề:** Radar chart cần tối thiểu 3 trục để vẽ polygon có nghĩa. Khi lớp chỉ có 2 kỹ năng (vd: Reading + Listening), Chart.js chỉ render một đường thẳng đứng — hoàn toàn vô nghĩa trực quan.

**File:** `src/components/reviews/RadarChartPanel.jsx`

**Hướng xử lý (A — Bar Chart fallback):**
- Kiểm tra `skills.length < 3` khi build chart.
- Nếu đúng → render **grouped bar chart** thay vì radar:
  - Trục X: tên kỹ năng (labels).
  - Trục Y: 0–100% (chuẩn hóa như radar hiện tại).
  - Mỗi dataset = 1 đợt đánh giá (giữ nguyên màu sắc `DATASET_COLORS`).
  - Grouped bars theo đợt để so sánh multi-period vẫn hoạt động.
- Nếu `skills.length >= 3` → giữ nguyên radar như hiện tại.
- Chart.js đã register sẵn các controller cần thiết, chỉ cần thêm `BarController`, `CategoryScale`, `LinearScale`, `BarElement`.
- Không cần thay đổi data model hay service layer.

**Ghi chú:** Ngưỡng `< 3` là điều kiện dứt khoát — radar với đúng 2 điểm luôn là đường thẳng, không có trường hợp ngoại lệ.

---

## [2] ReportCardModal — tên giáo viên luôn hiển thị '—'

**Vấn đề:** Phiếu kết quả gửi phụ huynh không hiển thị tên giáo viên (luôn ra `—`).

**Nguyên nhân:** `teacherName` đã bị xóa khỏi `settingsService` (tên giáo viên giờ lưu tại `teachers.name`, đọc qua `useAuth().teacher.name`). Nhưng `ReviewsPage` vẫn cố lấy từ `settings?.teacherName` → luôn `undefined` → `ReviewForm` lưu `null` vào DB → `ReportCardModal` không có gì để hiển thị.

**Chuỗi lỗi:**
```
settingsService.fromDB() không map teacherName
  → settings.teacherName = undefined
  → ReviewForm nhận teacherName=undefined, lưu null vào reviews.teacher_name
  → ReportCardModal: latestReview.teacherName=null, settings.teacherName=undefined → hiện '—'
```

**Files cần sửa:** `src/pages/ReviewsPage.jsx`

**Fix:**
```js
// Thêm useAuth()
const { teacher } = useAuth()

// Truyền teacher.name thay vì settings.teacherName
<ReviewForm teacherName={teacher?.name} ... />
<ReportCardModal settings={{ ...settings, teacherName: teacher?.name }} ... />
```

---

## [3] ReportCardModal — hiển thị maxScore và bỏ bo góc

**File:** `src/components/reviews/ReportCardModal.jsx`

**Thay đổi — Hiển thị maxScore trong bảng điểm kỹ năng:**
- Hiện tại dòng 134: `const pct = Math.round((score / skill.maxScore) * 100)` — `skill.maxScore` dùng để tính % nhưng không có trong `skillConfig` mới (chỉ có `name`, `order`). Cần lấy maxScore từ `latestReview.scoreMax[skill.name] ?? 9` (giống cách `RadarChartPanel` và `ReviewForm` làm).
- Dòng 139: đang hiển thị `{score}/{skill.maxScore}` → đổi thành `{score}/{maxScore}` lấy từ `latestReview.scoreMax`.
- Cập nhật logic tính `pct` dùng cùng source: `const maxScore = latestReview?.scoreMax?.[skill.name] ?? 9`.

---

## [4] Xuất phiếu hàng loạt (ảnh PNG + zip) cho cả lớp

**Tính năng:** Nút "Xuất Tất Cả" ở `ReviewsPage` → xuất phiếu PNG của toàn bộ học sinh trong lớp thành 1 file `.zip`.

**Quyết định đã chốt:**
- Output: 1 file `.zip` (dùng `jszip`) — cần `npm install jszip`
- Phạm vi: chỉ học sinh có ít nhất 1 đánh giá trong kỳ date range đang lọc
- Date range: dùng filter đang set ở trang, nhất quán với xuất đơn lẻ

**Luồng kỹ thuật:**
1. Load song song data của tất cả học sinh (reviews + attendancePct + homeworkPct + generalComment)
2. Filter ra danh sách học sinh có `latestReview != null`
3. Với mỗi học sinh (tuần tự): render card vào hidden `<div>` → `html2canvas` → blob PNG → thêm vào JSZip
4. `zip.generateAsync({ type: 'blob' })` → trigger download `phieu-[tenLop]-[ngay].zip`
5. Tên file trong zip: `phieu-[tenHocSinh].png`

**Progress UI:** Modal overlay hiện trong quá trình render — "Đang tạo phiếu... 3 / 8" + progress bar.

**Files cần tạo/sửa:**
- `src/components/reviews/BulkExportModal.jsx` — component mới: nhận danh sách học sinh + data, xử lý render tuần tự + zip
- `src/pages/ReviewsPage.jsx` — thêm nút "Xuất Tất Cả" ở header class, load data bulk, mount `BulkExportModal`

**Lưu ý implement:**
- Hidden render div phải `position: absolute; left: -9999px; top: 0` (không dùng `display:none` vì html2canvas cần element visible)
- `html2canvas` lazy import như pattern hiện tại (`await import('html2canvas')`)
- `jszip` cũng lazy import trong handler để không tăng bundle khởi động
