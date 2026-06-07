## Context

Bốn cải tiến UX độc lập gom chung một change vì cùng chạm tới luồng nhập liệu của giáo viên/admin. Ba trong số đó là tinh chỉnh UI thuần (xóa phiếu, định dạng tiền, ô sĩ số); phần thứ tư chạm tới data model (`Class.skillConfig`, `ReviewRecord`) và quan hệ Review ↔ Mock Test nên cần thiết kế cẩn thận.

Hiện trạng liên quan:
- `reviewService` (`src/services/reviewService.js`) **chưa có** method `remove` — phải thêm.
- `ReviewHistory` chỉ có `onEdit`, mỗi item click để sửa; không có nút xóa.
- `MockTestSectionBuilder` được dùng chung bởi `ClassModal` (cấu hình kỹ năng) và `MockTestModal` (section đề thi). `ClassModal` cần ẩn ô điểm tối đa, `MockTestModal` vẫn cần.
- `Class.skillConfig` lưu `{ name, maxScore, order }` (migration `20260603000001`); `DEFAULT_SKILL_CONFIG` export từ `classService.js`.
- `reviews.scores` là jsonb keyed theo tên kỹ năng; thang điểm hiện suy từ `skillConfig`.
- `ReviewsPage` đã nạp sẵn mock test gần nhất (`latestMockEntry`) để điền sẵn điểm — tái dùng nguồn này cho maxScore.
- Tiền tệ đã có `fmtVND`/`Intl.NumberFormat('vi-VN')` trong `utils/helpers`.
- `EnrollmentModal` render ô học phí ở **nhiều chỗ** (component `FeeInputs` + vài block inline) — cần thay tất cả.

## Goals / Non-Goals

**Goals:**
- Xóa được phiếu nhận xét với xác nhận, theo pattern danh bạ học viên.
- `CurrencyInput` tái dùng được, trả về số nguyên, định dạng dấu chấm theo thời gian thực.
- Ô sĩ số gõ thẳng, không phụ thuộc spinner.
- `skillConfig` chỉ còn `{ name, order }`; thang điểm phiếu nhận xét lấy từ mock test gần nhất và lưu snapshot.

**Non-Goals:**
- Không đổi cách nhập điểm mock test (mock test vẫn giữ `maxScore` per section — đây chính là nguồn thang điểm).
- Không migrate/drop `maxScore` orphan trong `classes.skill_config` cũ (chỉ bỏ qua ở app layer).
- Không đổi RLS / phân quyền.
- Không đổi `RadarChartPanel` ngoài việc nó vốn đã chuẩn hóa theo maxScore (sẽ nhận maxScore từ nguồn mới qua skills đã hợp nhất).

## Decisions

### 1. Xóa phiếu nhận xét
- Thêm `reviewService.remove(id)`: `supabase.from('reviews').delete().eq('id', id)`, throw khi lỗi.
- `ReviewHistory` nhận thêm prop `onDelete(review)`; render nút thùng rác (`Trash2`) trên mỗi item, `stopPropagation` để không trigger `onEdit`.
- `ReviewsPage` giữ state `deletingReview` + dùng `ConfirmModal` (đã có trong `@/components/ui`). Xác nhận → `remove` → reload + `toast.success`.
- *Alternative đã loại:* nút xóa trong `ReviewForm` lúc sửa — kém trực quan hơn so với xóa ngay trên timeline; user đã chỉ định "giống xóa học viên".

### 2. CurrencyInput
- Component mới `src/components/ui/CurrencyInput.jsx`, export qua `@/components/ui`.
- Props: `value` (number | '' ), `onChange(intValue)`, `label`, `error`, `placeholder='000đ'`, ...rest.
- Controlled: hiển thị = `value` đã format bằng `Intl.NumberFormat('vi-VN')`; suffix `đ` là adornment phải (không editable).
- `onChange`: strip mọi ký tự không phải digit → `parseInt` → trả số nguyên (hoặc `0`/`''` khi rỗng). Dùng `inputMode="numeric"`.
- *Alternative đã loại:* format khi blur thay vì real-time — user muốn thấy `1.400` ngay khi gõ.

### 3. Ô sĩ số gõ thẳng
- `ClassModal`: ô `maxStudents` chuyển từ `type="number"` → `type="text"` + `inputMode="numeric"`; `onChange` lọc `replace(/\D/g, '')` rồi `Number(...) || 0`.
- *Alternative đã loại:* giữ `type="number"` + auto-select on focus — vẫn còn spinner, không đáp ứng yêu cầu.

### 4. skillConfig bỏ maxScore + thang điểm từ mock test
- **`DEFAULT_SKILL_CONFIG`**: đổi sang `[{ name, order }]` (bỏ `maxScore`).
- **`classService` `fromDB/toDB`**: chỉ map `name`, `order` cho từng skill; bỏ qua `maxScore` đọc từ DB cũ.
- **`MockTestSectionBuilder`**: thêm prop `showMaxScore = true`. `ClassModal` truyền `showMaxScore={false}` (ẩn ô điểm tối đa); `MockTestModal` giữ mặc định `true`.
- **`ClassModal`** `toSections/toSkillConfig`: section dùng cho builder gắn `maxScore` mặc định (để builder render được khi cần) nhưng khi lưu chỉ ghi `{ name, order }`.
- **`MockTestModal`**: khi init sections từ `skillConfig` (giờ không có maxScore) → gán `maxScore` mặc định `9`.
- **`ReviewRecord`** thêm `scoreMax: { [skillName]: number }`:
  - `reviewService.fromDB/toDB` map `scoreMax ↔ score_max`.
  - DB: migration thêm cột `reviews.score_max jsonb NOT NULL DEFAULT '{}'`.
- **`ReviewForm`** hợp nhất danh sách kỹ năng để render:
  - Tên kỹ năng từ `skillConfig` của lớp.
  - `maxScore` mỗi kỹ năng lấy theo thứ tự ưu tiên: **edit** → `editingReview.scoreMax[name]`; **create** → maxScore từ `latestMockEntry.mockTest.sections` (map theo tên); fallback `9`.
  - Khi tạo mới và pre-fill: lưu `scoreMax` snapshot vào data gửi `onSave`.
- **`ReviewsPage`**:
  - Tính `maxScoreMap` từ `latestMockEntry.mockTest.sections` truyền xuống `ReviewForm`.
  - Khi học sinh **chưa có mock test** (`!latestMockEntry`): ẩn/khóa nút "Thêm đánh giá" + helper text "Tạo mock test trước để đánh giá".
- *Alternative đã loại:* lưu `mockTestId` tham chiếu thay vì snapshot `scoreMax` — phức tạp hơn, phiếu cũ sẽ đổi thang khi mock test đổi (user muốn giữ nguyên lúc tạo).

## Risks / Trade-offs

- **[Phiếu cũ không có `scoreMax`]** → `ReviewForm` fallback maxScore `9` (IELTS) khi `scoreMax` rỗng; chấp nhận được vì dữ liệu cũ chủ yếu thang 9.
- **[`MockTestSectionBuilder` dùng chung 2 nơi]** → dùng prop `showMaxScore` có default `true` nên `MockTestModal` không đổi hành vi; chỉ `ClassModal` opt-out.
- **[Chặn tạo đánh giá khi chưa có mock test]** → có thể bất ngờ với giáo viên; giảm thiểu bằng helper text rõ ràng hướng dẫn tạo mock test trước.
- **[`EnrollmentModal` có nhiều ô fee trùng lặp]** → rà soát thay tất cả điểm dùng `type="number"` cho fee bằng `CurrencyInput`; rủi ro sót chỗ → kiểm thử cả luồng tạo mới và sửa.
- **[maxScore orphan trong `classes.skill_config`]** → để lại không drop; app layer bỏ qua nên vô hại.

## Migration Plan

1. Thêm migration `supabase/migrations/<timestamp>_add_reviews_score_max.sql`: `ALTER TABLE reviews ADD COLUMN score_max jsonb NOT NULL DEFAULT '{}';`
2. Cập nhật `seed_mock_data.sql`: bỏ `maxScore` khỏi `skill_config` mẫu, thêm `score_max` cho review mẫu (khớp scores).
3. Triển khai code; `skill_config` cũ vẫn đọc được (maxScore bị bỏ qua), không cần backfill.
4. **Rollback:** `ALTER TABLE reviews DROP COLUMN score_max;` và revert code. `skill_config` không đổi schema nên không cần rollback DB cho phần đó.

## Open Questions

- Không còn — các quyết định (snapshot `scoreMax`, chặn tạo khi chưa có mock test, edit giữ nguyên thang) đã chốt với user.
