## Why

Web hiện đang quản lý lớp/học viên/điểm danh/Mock Test khá đầy đủ, nhưng ba mảng quan trọng còn thiếu hoặc dở: **Học Phí** mới là placeholder, **Nộp Bài** chưa có cơ chế theo dõi nộp + chấm điểm, và giáo viên chưa có **Báo Cáo** tổng hợp để gửi phụ huynh. Đây là ba việc giáo viên phải làm thủ công hằng tháng, gây mất thời gian và dễ sai sót.

## What Changes

- **Học Phí**: Biến tab placeholder thành module quản lý thu học phí thực sự — ghi nhận từng khoản thu (số tiền, ngày đóng, hình thức tiền mặt/chuyển khoản), trạng thái đã đóng/còn nợ, tổng thu theo tháng, danh sách học viên còn nợ.
- **Nộp Bài**: Mở rộng sub-tab "Bài Tập" trong `ClassDetailPage` — thêm bảng học viên × bài tập với trạng thái đã nộp/chưa nộp, ô điểm và ô nhận xét của giáo viên. Không tạo tab chính mới (gắn theo lớp tự nhiên hơn).
- **Báo Cáo**: Thêm tab chính mới — dashboard tổng hợp điểm danh theo tháng, tiến độ điểm Mock Test theo thời gian, tổng thu học phí; có nút xuất Excel/PDF cho từng loại báo cáo để gửi phụ huynh.
- Mở rộng local store (data layer) để lưu khoản thu học phí, trạng thái nộp bài, điểm và nhận xét.
- Tận dụng thư viện đã có: `xlsx` cho Excel, `html2canvas` + tạo PDF cho báo cáo, `chart.js` cho biểu đồ tiến độ.

## Capabilities

### New Capabilities
(không có — các tính năng mới mở rộng capability đã có)

### Modified Capabilities
- `data`: Thêm entity/schema cho khoản thu học phí, trạng thái nộp bài, điểm & nhận xét bài tập trong local store.
- `pages`: Biến `FeesPage` từ placeholder thành trang quản lý học phí đầy đủ; thêm trang `ReportsPage` mới; mở rộng `HomeworkTab` trong `ClassDetailPage` với bảng nộp bài/chấm điểm.
- `ui`: Thêm các component mới — bảng thu học phí, modal ghi nhận thanh toán, bảng nộp bài/chấm điểm theo học viên, các card báo cáo và nút xuất Excel/PDF.

## Impact

- **Code chịu ảnh hưởng**:
  - `src/pages/FeesPage.jsx` (rewrite từ placeholder), `src/pages/ReportsPage.jsx` (mới)
  - `src/components/class-detail/HomeworkTab.jsx` (mở rộng), `HomeworkSummaryFooter.jsx` (đang phát triển — tích hợp)
  - `src/store/*` hoặc local DB layer (mở rộng schema)
  - `src/components/Navbar.jsx` (thêm mục "Báo Cáo")
- **Dependencies**: Không cần thêm package — dùng `xlsx`, `html2canvas`, `chart.js`, `lucide-react` đã có.
- **Backward compatibility**: Dữ liệu cũ trong local storage phải migrate nhẹ (thêm field mới với default rỗng). Không breaking.
- **Phạm vi**: Single-user (1 giáo viên), không cần auth/multi-user.
