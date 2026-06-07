## Why

Bốn điểm cọ xát trong vận hành hàng ngày làm chậm giáo viên/admin: (1) không xóa được phiếu nhận xét đã tạo nhầm, (2) nhập học phí phải đếm số 0 thủ công dễ sai, (3) ô sĩ số bắt bấm mũi tên thay vì gõ thẳng, và (4) thang điểm (maxScore) của phiếu nhận xét lấy từ cấu hình lớp nên lệch với mock test mà điểm thực sự được lấy ra. Sửa cùng lúc để trải nghiệm nhập liệu nhất quán và đúng nguồn dữ liệu.

## What Changes

- **Xóa phiếu nhận xét:** Thêm khả năng xóa một phiếu đánh giá đã tạo (kèm xác nhận), theo đúng pattern xóa ở danh bạ học viên.
- **Ô nhập học phí tự định dạng:** Tạo `CurrencyInput` hiển thị placeholder `000đ`, tự chèn dấu chấm phân tách hàng nghìn khi gõ (`1` → `14` → `140` → `1.400`), và hiển thị giá trị đã lưu dạng `1.400.000đ`. Áp dụng cho `PaymentModal` và `EnrollmentModal`.
- **Ô sĩ số gõ thẳng:** Bỏ spinner của ô "Sĩ số tối đa" trong `ClassModal`, cho gõ số trực tiếp (`inputMode="numeric"`, lọc ký tự không phải số).
- **BREAKING — Cấu hình kỹ năng chỉ còn tên:** `Class.skillConfig` bỏ trường `maxScore`, chỉ còn `{ name, order }`. Builder cấu hình kỹ năng trong `ClassModal` không còn ô nhập điểm tối đa.
- **Thang điểm phiếu nhận xét lấy từ mock test gần nhất:** Khi tạo đánh giá mới, cả điểm lẫn `maxScore` đều lấy từ mock test gần nhất của học sinh. Nếu học sinh chưa có mock test nào thì không cho tạo đánh giá (ẩn/khóa nút kèm hướng dẫn). `maxScore` của từng kỹ năng được lưu snapshot vào phiếu nhận xét; phiếu cũ khi mở chỉnh sửa giữ nguyên `maxScore` lúc tạo.

## Capabilities

### New Capabilities
- *(không có capability mới — các thay đổi đều rơi vào capability hiện hữu)*

### Modified Capabilities
- `pages`: ClassModal bỏ cấu hình maxScore; ReviewForm đổi nguồn maxScore sang mock test gần nhất và chặn tạo khi chưa có mock test; bổ sung khả năng xóa phiếu nhận xét; ô sĩ số gõ thẳng.
- `ui`: Bổ sung component `CurrencyInput` định dạng tiền tệ VND theo thời gian thực.
- `data`: `Class.skillConfig` bỏ `maxScore`; `ReviewRecord` lưu thêm snapshot `scoreMax` theo tên kỹ năng.

## Impact

- **Components:** `ReviewHistory.jsx`, `ReviewsPage.jsx`, `ReviewForm.jsx`, `ClassModal.jsx`, `MockTestSectionBuilder.jsx`, `PaymentModal.jsx`, `EnrollmentModal.jsx`, mới: `src/components/ui/CurrencyInput.jsx` (export qua `@/components/ui`).
- **Services:** `classService.js` (`DEFAULT_SKILL_CONFIG`, `fromDB/toDB` bỏ maxScore), `reviewService.js` (`fromDB/toDB` thêm `scoreMax`, dùng `remove` sẵn có).
- **DB / seed:** `reviews` cần cột lưu `score_max` (jsonb); `classes.skill_config` bỏ qua `maxScore` ở application layer (giá trị cũ orphan, không bắt buộc migration drop). Cập nhật `seed_mock_data.sql` cho khớp.
- **Tài liệu:** Cập nhật `CLAUDE.md` mục "Model đánh giá kỹ năng" và README phần liên quan.
