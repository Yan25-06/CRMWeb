## Context

Tab "Nhận Xét" hiện là placeholder. Data layer đã có `phf_reviews` (shape: `id, studentId, classId, date, speakScore, writeScore, remark, absent, absentReason`) và `phf_session_reviews` (shape: `id, studentId, classId, sessionId?, text, createdAt`) với CRUD cơ bản. Tuy nhiên, `phf_reviews` thiếu `readScore`, `listenScore`, `tags`, `advice` so với yêu cầu biểu đồ radar 4 kỹ năng.

Project đã có `chart.js`, `html2canvas`, `jspdf` trong dependencies. Navbar đã có mục "Nhận Xét" trỏ đến placeholder.

## Goals / Non-Goals

**Goals:**
- Xây dựng trang Nhận Xét với flow: chọn lớp → chọn học viên → xem/tạo nhận xét.
- Biểu đồ Radar 4 kỹ năng (Nghe, Nói, Đọc, Viết) dùng chart.js, overlay nhiều đợt đánh giá.
- Quick Tag Editor: nhãn soạn sẵn (tích cực / cần cố gắng) để tạo nhanh nhận xét.
- Form nhận xét: chấm điểm kỹ năng + ghi chú + lời khuyên.
- Report Card Generator: xuất phiếu kết quả PDF/ảnh chuyên nghiệp gửi phụ huynh.

**Non-Goals:**
- Không hỗ trợ phụ huynh tự xem nhận xét online (chỉ gửi file offline qua Zalo/Email).
- Không xây dựng hệ thống rating/đánh giá giáo viên.
- Không tích hợp AI gợi ý nhận xét tự động.

## Decisions

### 1. Component Architecture

```
ReviewsPage.jsx
├── ReviewSelector (chọn lớp → chọn học viên)
├── ReviewContent (layout 2 cột)
│   ├── RadarChartPanel (biểu đồ radar + lịch sử đợt đánh giá)
│   └── QuickReviewPanel (tag editor + form nhận xét buổi học)
├── ReviewForm (modal form chấm điểm kỹ năng định kỳ)
├── ReviewHistory (danh sách nhận xét cũ)
└── ReportCardModal (preview + xuất PDF/ảnh)
```

**Rationale**: Chia layout 2 cột (biểu đồ bên trái, nhận xét bên phải) giúp giáo viên thấy trực quan năng lực + nhận xét cùng lúc. Trên mobile chuyển thành 1 cột xếp dọc.

### 2. Radar Chart — chart.js Radar type

Dùng `chart.js` (đã có) với type `radar`. 4 trục: Listening, Speaking, Reading, Writing (scale 0-9 cho IELTS hoặc 0-10 general). Overlay nhiều datasets (mỗi đợt = 1 dataset màu khác) để thấy tiến bộ.

**Alternatives considered**:
- D3.js: Quá nặng, không cần. chart.js đã đủ và đã có sẵn.
- Custom SVG: Tốn thời gian implement, chart.js radar đã đẹp.

### 3. Quick Tag System

Hai nhóm tag:
- **Tích cực** (xanh): "Hăng hái", "Phát âm chuẩn", "Làm tốt bài tập", "Hiểu bài nhanh", "Tiến bộ rõ rệt"
- **Cần cố gắng** (vàng/đỏ): "Quên bài tập", "Còn thụ động", "Cần luyện viết thêm", "Đến muộn", "Chưa tập trung"

Tags được lưu dưới dạng `tags: string[]` trong ReviewRecord. Khi xuất Report Card, tags được tổng hợp thành câu nhận xét tự nhiên.

**Rationale**: Giáo viên thường nhận xét lặp lại, click nhanh hơn gõ. Tags dạng pill buttons quen thuộc UX.

### 4. Data Model Extension

Mở rộng `ReviewRecord` hiện có:
```typescript
{
  // Existing fields
  id, studentId, classId, date, speakScore, writeScore, remark,
  // New fields
  readScore?: number,    // Điểm đọc (0-9)
  listenScore?: number,  // Điểm nghe (0-9)
  tags?: string[],       // Nhãn nhận xét nhanh
  advice?: string,       // Lời khuyên cá nhân hóa
  teacherName?: string,  // Tên giáo viên (từ settings)
}
```

Backward compatible: `readScore`, `listenScore`, `tags`, `advice` đều optional — records cũ vẫn hoạt động.

### 5. Report Card Generation

Flow: user bấm "Xuất Phiếu" → modal preview → chọn "Tải ảnh" hoặc "Tải PDF".
- **Ảnh**: `html2canvas` chụp DOM → download PNG.
- **PDF**: `html2canvas` → `jspdf` → download PDF.

Report Card layout:
- Header: logo trung tâm + tên trung tâm (từ settings.centerName)
- Body: thông tin học viên, biểu đồ radar, bảng điểm 4 kỹ năng, tags tổng hợp, lời khuyên
- Footer: tên giáo viên, ngày lập

### 6. Review History

Hiển thị timeline các nhận xét đã tạo cho học viên, sort theo date DESC. Mỗi entry show: date, scores, tags, remark. Click entry → mở form sửa.

## Risks / Trade-offs

- **[html2canvas quality]** Biểu đồ canvas (chart.js) khi chụp bằng html2canvas có thể bị mờ ở DPI thấp. → **Mitigation**: Set `scale: 2` trong html2canvas options.
- **[Data migration]** Records cũ không có `readScore/listenScore/tags/advice`. → **Mitigation**: Tất cả field mới optional, fallback `undefined/[]`. Không cần migration script.
- **[Tag list hardcoded]** Tags soạn sẵn được hardcode. Nếu giáo viên muốn custom tags → chưa hỗ trợ phase này. → **Mitigation**: Thiết kế tags dạng config array, dễ mở rộng sau.
