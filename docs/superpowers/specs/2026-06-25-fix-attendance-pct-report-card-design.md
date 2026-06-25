# Design: Đồng bộ % Chuyên Cần — Phiếu Xuất & Nhận Xét

**Ngày:** 2026-06-25  
**Scope:** Sửa bug tính sai % chuyên cần trên phiếu nhận xét (đơn lẻ + hàng loạt)

---

## Vấn đề

Hệ thống điểm danh dùng mô hình **"mặc định có mặt"**: chỉ buổi vắng mới lưu bản ghi với `present === false`; buổi có mặt thường không có bản ghi.

Vì vậy mẫu số đúng phải là **số buổi học (sessions)**, không phải số bản ghi điểm danh.

### Hai cách tính đang tồn tại

| Nơi | Công thức | Kết quả (Kim Khánh) |
|---|---|---|
| `AttendancePanel` (bảng Điểm Danh trong trang nhận xét) | `(buổi − vắng) / buổi` — đúng | **75%** ✅ |
| `ReviewsPage` (phiếu đơn lẻ) | `present !== false / attRecs.length` | **0%** ❌ |
| `BulkExportModal` (phiếu hàng loạt) | giống ReviewsPage | **0%** ❌ |

ReviewsPage và BulkExportModal trả 0% vì dùng `attRecs.length` (chỉ đếm bản ghi tồn tại, tức là các buổi vắng) làm mẫu số — bỏ qua hoàn toàn buổi có mặt không có bản ghi.

---

## Thiết kế

### 1. Thêm method `attendanceService.getRateByRange`

File: `src/services/attendanceService.js`

```js
async getRateByRange(studentId, classId, fromDate, toDate) {
  // Lấy sessions trong khoảng (mẫu số)
  // Lấy bản ghi điểm danh của học viên trong đó (tìm vắng)
  // Trả { present, total, pct } với pct = (total - absent) / total
  // Làm tròn 1 chữ số thập phân (* 1000 / 10)
  // Trả null khi total === 0
}
```

Logic:
- Query sessions trong khoảng `fromDate–toDate` của class → `total = sessions.length`
- Query attendance records của student trong sessionIds đó → `absent = count(r.present === false)`
- `present = total - absent`
- `pct = total > 0 ? Math.round(((total - absent) / total) * 1000) / 10 : null`

### 2. Sửa ReviewsPage.jsx (phiếu đơn lẻ)

File: `src/pages/ReviewsPage.jsx` ~ dòng 261–284

Thay khối tự tính:
```js
const present = attRecs.filter(r => r.present !== false).length
setAttendancePct(Math.round((present / attRecs.length) * 1000) / 10)
```

Bằng:
```js
const rate = await attendanceService.getRateByRange(...)
setAttendancePct(rate?.pct ?? null)
```

(Bỏ luôn `getByRange` call cho attendance — chỉ giữ homework.)

### 3. Sửa BulkExportModal.jsx (phiếu hàng loạt)

File: `src/components/reviews/BulkExportModal.jsx` ~ dòng 14, 22–25

Thay tương tự: dùng `getRateByRange` thay vì `getByRange` + tính tay.

### 4. Refactor AttendancePanel.jsx dùng getRateByRange

File: `src/components/reviews/AttendancePanel.jsx`

Giữ nguyên danh sách buổi (UI không đổi), nhưng tính `pct` từ `getRateByRange` thay vì tính inline — để 3 nơi cùng một nguồn logic.

Vì `AttendancePanel` vẫn cần danh sách items để render, nó vẫn fetch sessions + records. Nhưng pct nên dùng hàm chung để đảm bảo không bao giờ lệch.

---

## Điều không thay đổi

- `attendanceService.getRate` (all-time, dùng trong widget danh bạ) — giữ nguyên
- `attendanceService.getByRange` — giữ nguyên (vẫn dùng bởi `AttendancePanel` cho danh sách)
- Mô hình DB, RLS, cách lưu điểm danh — không đụng

---

## Kiểm thử thủ công

1. Mở học viên Kim Khánh (TOEIC 02) trong trang Nhận Xét
2. So sánh % Chuyên cần trong bảng Điểm Danh vs phiếu xem trước → phải bằng nhau (75%)
3. Xuất phiếu đơn lẻ (PNG/PDF) → kiểm tra 75%
4. Xuất hàng loạt → kiểm tra 75%
5. Học viên chưa có buổi nào trong khoảng → phiếu hiển thị "—" không crash
