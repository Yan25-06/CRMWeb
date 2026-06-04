## Context

`MockTestTab` đã tính điểm tổng/trung bình mỗi bài mock (có color coding theo % : xanh ≥80%, vàng 50–79%, đỏ <50%) và hiển thị "điểm gần nhất" của học sinh trong sidebar. `ReviewsPage` đã có `useDebounce` + ô tìm kiếm trong sidebar individual mode. `ClassOverviewTable` hiện liệt kê học sinh của lớp với điểm/nhận xét nhưng chưa có cột mock test. Dữ liệu mock qua `mockTestService` (bài) + `mockTestResultService` (kết quả theo học sinh).

## Goals / Non-Goals

**Goals:**
- Thêm cột "điểm mock gần nhất" + "chênh lệch so với lần trước" vào `ClassOverviewTable`.
- Thêm ô tìm kiếm vào sidebar `MockTestTab`.

**Non-Goals:**
- Không đổi cách tính điểm mock hay schema kết quả.
- Không thêm biểu đồ mới (drill-down là việc của reports-overhaul).

## Decisions

### 1. "Điểm mock gần nhất" = điểm tổng/trung bình của bài mock mới nhất
Tái dùng đúng cách `MockTestTab` tính điểm tổng một bài (trung bình các section, hoặc % chuẩn hóa đang dùng). Lấy bài mock có ngày mới nhất mà học sinh có kết quả → đó là "điểm gần nhất". Hiển thị "—" nếu chưa có.

### 2. "Chênh lệch" = điểm gần nhất − điểm bài mock liền trước
Lấy 2 bài mock gần nhất (theo ngày) mà học sinh có kết quả, tính hiệu. Hiển thị ▲ +x (xanh) khi tăng, ▼ −x (đỏ) khi giảm, "—" khi chỉ có ≤1 bài. Đơn vị nhất quán với cột điểm gần nhất.

### 3. Gộp dữ liệu mock ở page level
`ReviewsPage` load mock tests + results của lớp một lần, dựng map `studentId → [kết quả theo thời gian]`, truyền xuống `ClassOverviewTable`. Tránh N+1 truy vấn theo từng dòng.

### 4. Ô tìm kiếm MockTestTab
Tái dùng `Input` + icon search + `useDebounce` giống `ReviewsPage`. Lọc danh sách học sinh trong sidebar theo tên (không phân biệt hoa thường, bỏ dấu nếu `ReviewsPage` đang làm vậy — giữ nhất quán).

## Risks / Trade-offs

- **Định nghĩa "điểm tổng" của mock khi có nhiều section/thang khác nhau** → dùng đúng công thức `MockTestTab` đang hiển thị để nhất quán toàn app; nếu là % thì cả 2 cột dùng %.
- **Thứ tự "bài trước" khi cùng ngày** → sắp theo ngày rồi `createdAt` để xác định thứ tự ổn định.

## Migration Plan

1. Trích/áp dụng hàm tính điểm tổng mock (tái dùng từ `MockTestTab`).
2. `ReviewsPage` gộp dữ liệu mock theo học sinh, thêm 2 cột vào `ClassOverviewTable`.
3. Thêm ô tìm kiếm vào sidebar `MockTestTab`.
4. Rollback: revert UI; không thay đổi DB.
