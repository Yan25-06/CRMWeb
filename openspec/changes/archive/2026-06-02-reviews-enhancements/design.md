## Context

ReviewsPage đã hoàn chỉnh với: RadarChartPanel, QuickTagEditor, ReviewForm, ReviewHistory, ReportCardModal (xuất PNG/PDF). Data layer có `phf_reviews`, `phf_attendance`, `phf_homework`, `phf_submissions`. 3 tính năng mới phải tích hợp mượt vào layout hiện tại mà không phá vỡ flow cũ.

## Goals / Non-Goals

**Goals:**
- DateRangeFilter toàn trang: 1 component duy nhất, state lift ở ReviewsPage, truyền xuống tất cả panels.
- AttendancePanel + HomeworkPanel: tính % chuyên cần / % hoàn thành từ data hiện có theo dateRange.
- ViewModeToggle [Cá Nhân] | [Tổng Quan Lớp]: toggle state đơn, thay đổi toàn bộ content area.
- ClassOverviewTable: render tổng hợp per-student, không cần cache — lớp tối đa ~30 học viên.
- ClassPdfExport: loop render từng học viên thành canvas → combine nhiều trang jsPDF.
- GeneralCommentPanel: textarea + debounced auto-save vào `phf_general_comments`. Hiện trong PDF.

**Non-Goals:**
- Không hỗ trợ phụ huynh xem online.
- Không custom tag list từ UI.
- Không AI gợi ý nhận xét.
- Không sync data lên server.

## Decisions

### 1. DateRangeFilter State — lifted to ReviewsPage

State `{ fromDate, toDate }` đặt tại `ReviewsPage` (không dùng Context). Truyền xuống qua props cho AttendancePanel, HomeworkPanel, ReviewHistory, ClassOverviewTable, và ReportCardModal. Default: fromDate = đầu tháng hiện tại, toDate = hôm nay.

**Alternatives considered**:
- React Context: overkill — ReviewsPage đã là root của tất cả children, props đủ.
- URL params: tốt cho bookmark nhưng phức tạp hơn cần thiết cho use-case offline này.

### 2. AttendancePanel — tính từ phf_attendance

Không thêm field mới vào AttendanceRecord. Filter `phf_attendance` theo `studentId + classId + date BETWEEN fromDate-toDate`. % chuyên cần = count(present=true) / count(total). Danh sách hiển thị sort by date DESC.

### 3. HomeworkPanel — tính từ phf_homework + phf_submissions

Filter `phf_homework` theo `classId + assignedAt BETWEEN fromDate-toDate`. Với mỗi Homework, lookup Submission của `studentId`. % hoàn thành = count(submitted=true) / count(total homework). Danh sách hiển thị với trạng thái từng bài.

### 4. ViewModeToggle — single enum state

```
viewMode: "individual" | "overview"
```

Khi `overview`: ẩn ReviewSelector (student list), ẩn tất cả individual panels, hiện ClassOverviewTable toàn màn hình. DateRangeFilter vẫn hiển thị ở cả 2 mode.

**Rationale**: Toggle đơn giản nhất — không cần router sub-route.

### 5. ClassOverviewTable — compute on render

Với mỗi học viên trong lớp đang chọn: tính `attendancePct` và `homeworkPct` bằng cùng logic AttendancePanel/HomeworkPanel, lấy `latestReview.remark || tags[0]` cho cột nhận xét gần nhất. Tổng học viên/lớp thường < 30 nên tính trực tiếp không cần memo phức tạp.

### 6. ClassPdfExport — sequential html2canvas + jsPDF

Flow:
1. Render invisible `<ClassReportCardContent student={s} />` cho mỗi học viên vào off-screen div.
2. `html2canvas(div, { scale: 2 })` → canvas per student.
3. Tạo 1 `jsPDF` doc, loop canvas → `doc.addPage()` → `doc.addImage(canvas)`.
4. `doc.save("nhan-xet-lop-<tên lớp>-<date>.pdf")`.

**Risk**: Sequential render có thể chậm với lớp > 15 học viên. → **Mitigation**: Hiển thị loading spinner + progress counter "Đang xử lý X/Y học viên".

### 7. GeneralComment — phf_general_comments + debounced save

Data store: `phf_general_comments` — array of `{ id, studentId, classId, text, updatedAt }`, composite key = `studentId + classId` (1 record per student per class). Dùng `upsertGeneralComment` (find-or-create by composite key).

Auto-save: debounce 800ms sau khi user ngừng gõ — không cần nút Lưu riêng. Indicator "Đã lưu" 1.5s.

**Rationale**: Teacher UX quen thuộc (Google Docs style auto-save). Tránh mất nhận xét khi quên nhấn Lưu.

### 8. ReportCardModal — thêm 3 section mới

Layout phiếu bổ sung sau phần radar chart:
- **Stats row**: Chuyên cần X%, Bài tập X% (tính theo dateRange khi mở modal).
- **Khoảng thời gian**: "Từ DD/MM/YYYY đến DD/MM/YYYY".
- **Nhận xét chung**: Text của `generalComment` (nếu có), dưới lời khuyên.

Modal nhận thêm props: `dateRange`, `attendancePct`, `homeworkPct`, `generalComment`.

## Risks / Trade-offs

- **[html2canvas + chart.js trong ClassPdfExport]** Chart.js render trong off-screen div có thể không hoàn chỉnh trước khi html2canvas chạy. → **Mitigation**: Dùng `await new Promise(r => setTimeout(r, 100))` sau khi mount chart, trước khi capture.
- **[phf_general_comments mới]** Cold start app đọc key chưa có → trả về `[]` như các store khác (backward compat tự nhiên).
- **[DateRangeFilter props drilling]** Truyền qua nhiều cấp. → **Mitigation**: Chấp nhận — chỉ 2-3 cấp, không đủ để justify Context.
