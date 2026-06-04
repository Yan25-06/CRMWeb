## Context

`FeesPage` đã tính cho mỗi học sinh: học phí phải đóng (`calcFee`), đã đóng (từ `paymentService`), và nợ (= phải đóng − đã đóng). `ReportsPage` đã dùng `ExportButtons` (Excel + PDF) — pattern xuất sẵn có để tái dùng. `StudentsDirectoryPage` đã có map `studentId → [enrollments]` và bộ lọc trạng thái/lớp/loại khóa + tìm kiếm; danh sách hiển thị là một mảng đã lọc.

## Goals / Non-Goals

**Goals:**
- Lọc nhanh học sinh theo trạng thái thanh toán trên `FeesPage`.
- Xuất Excel/PDF bảng học phí (theo bộ lọc) và Excel danh bạ (theo bộ lọc).

**Non-Goals:**
- Không đổi công thức học phí hay thêm trạng thái vào DB.
- Không xuất PDF cho Students Directory (chỉ Excel theo yêu cầu J1).

## Decisions

### 1. Trạng thái thanh toán suy ra client-side
Mỗi học sinh xếp vào đúng 1 nhóm dựa trên (phải đóng, đã đóng):
- **Đã đóng đủ**: đã đóng ≥ phải đóng (và phải đóng > 0).
- **Đóng một phần**: 0 < đã đóng < phải đóng.
- **Còn nợ**: đã đóng = 0 và phải đóng > 0.
- (Học sinh phải đóng = 0 không tính là nợ.)
Bộ lọc là các tab/pill như filter bar khác trong app, kèm số đếm mỗi nhóm. "Còn nợ" gồm cả "đóng một phần"? — Không: ba nhóm tách biệt; có thể coi "Còn nợ" = chưa đóng đồng nào, để giáo viên phân biệt rõ. Tab "Tất cả" hiển thị toàn bộ.

### 2. Export tái dùng ExportButtons
Dùng `ExportButtons` (Excel + PDF) như `ReportsPage`. Dữ liệu xuất = danh sách **đang được lọc** (đúng bộ lọc trạng thái hiện tại), cột: Học sinh, Lớp, Phải đóng, Đã đóng, Còn nợ, Trạng thái. PDF render từ bảng (html2canvas + jspdf) hoặc bảng dựng sẵn; Excel qua `xlsx`. Tên file kèm tháng/năm.

### 3. Export Excel cho Students Directory
Nút "Xuất Excel" xuất mảng học sinh **đang hiển thị** (sau lọc + tìm) qua `xlsx`, cột: Họ tên, Khối, SĐT, Email, Lớp (gộp), Trạng thái. Không kèm PDF.

## Risks / Trade-offs

- **Định nghĩa nhóm "đóng một phần" vs "còn nợ"** → chốt rõ ở Decision 1 để UI và export nhất quán; hiển thị tooltip/nhãn rõ ràng.
- **PDF từ bảng dài** → tái dùng cách `ReportsPage` đã xử lý; nếu bảng quá dài cân nhắc phân trang ảnh, nhưng giữ đơn giản trước.

## Migration Plan

1. Thêm hàm phân loại trạng thái thanh toán + bộ lọc tab trên `FeesPage`.
2. Gắn `ExportButtons` (Excel/PDF) xuất theo danh sách đã lọc.
3. Thêm nút "Xuất Excel" trên `StudentsDirectoryPage` xuất danh sách đang hiển thị.
4. Rollback: revert UI; không có thay đổi DB.
