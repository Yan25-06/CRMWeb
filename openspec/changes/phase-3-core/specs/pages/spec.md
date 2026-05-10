# Delta Spec: Phase 3 — Điểm Danh & Học Phí

## ADDED Requirements

### Requirement: AttendancePage — Chấm Điểm Danh
- GIVEN user chọn tab "Điểm Danh"
- Page có sub-tabs: "Chấm Điểm Danh" | "Xem Điểm Danh"
- Default: Chấm Điểm Danh

#### Sub-view: Chấm Điểm Danh
- Filter bar: select Lớp + date input (default: hôm nay)
- WHEN lớp + ngày được chọn → hiện danh sách HS trong lớp
- Mỗi HS: avatar chữ cái + tên + toggle Có/Vắng
- Toggle: click để đổi trạng thái (Có = emerald, Vắng = red)
- Counter bar: "X/Y học sinh đã chấm"
- Nút "Lưu Điểm Danh" → upsertAttendance() → toast success

#### Scenario: Chấm điểm danh
- GIVEN đã chọn lớp và ngày
- WHEN user toggle từng HS
- THEN trạng thái thay đổi realtime (local state)
- WHEN bấm Lưu
- THEN upsertAttendance(records) gọi
- AND toast "Đã lưu điểm danh ngày DD/MM/YYYY!"

#### Scenario: Load điểm danh cũ
- GIVEN đã có điểm danh cho ngày đã chọn
- WHEN user chọn lại ngày đó
- THEN prefill trạng thái từ db (hiện đúng Có/Vắng đã lưu)

#### Sub-view: Xem Điểm Danh
- Bảng tổng hợp tháng: rows = học sinh, cols = ngày có lịch
- Cell: ✓ (có mặt, emerald), ✗ (vắng, red), — (không có lịch)
- Cột cuối: Tổng buổi (số buổi có mặt)
- Lọc theo lớp
- Scroll ngang trên mobile

### Requirement: FeesPage — Học Phí
- Table: Học Sinh, Lớp, Buổi học, Học phí/buổi, Phụ phí, Tổng, Trạng thái, Thao tác
- "Tổng" = buổi × đơn giá + phụ phí (tự tính từ attendance)
- Trạng thái: badge "Chưa thu" (warning) / "Đã thu" (success)
- Thao tác: nút "Đã thu" toggle, nút "Xuất phiếu"
- Summary row ở footer: tổng doanh thu tháng

#### Scenario: Đánh dấu đã thu
- WHEN bấm "Đánh dấu đã thu"
- THEN upsertFee({ paid: true, paidAt: Date.now() })
- AND badge đổi sang "Đã thu"
- AND toast "Đã cập nhật trạng thái!"

#### Scenario: Xuất phiếu học phí
- WHEN bấm "Xuất phiếu" cho 1 HS
- THEN mở modal preview phiếu
- Phiếu bao gồm: tên trung tâm, tên HS, lớp, tháng/năm, bảng ngày điểm danh, tổng buổi, đơn giá, phụ phí, TỔNG
- Nút "Tải xuống PNG" → html2canvas → download
- Design phiếu: Navy header, white body, clean typography

#### Scenario: Điều chỉnh phụ phí
- WHEN bấm icon edit trên row
- THEN hiện inline input cho Phụ phí và Ghi chú
- Confirm → upsertFee() → recalculate total

### Requirement: Fee Receipt Design (Phiếu Học Phí)
```
┌─────────────────────────────────┐
│  [LOGO] TÊN TRUNG TÂM          │  ← navy-900 bg, white text
│  Phiếu Học Phí Tháng X/YYYY   │
├─────────────────────────────────┤
│  Học sinh: [Tên]                │
│  Lớp: [Tên lớp]                │
├─────────────────────────────────┤
│  Ngày học: 1,3,5,8,10...       │
│  Tổng số buổi: X buổi          │
│  Học phí/buổi: XXX,XXXđ        │
│  Phụ phí: XXX,XXXđ             │
├─────────────────────────────────┤
│  TỔNG CỘNG: X,XXX,XXXđ         │  ← bold, navy-800
└─────────────────────────────────┘
```
