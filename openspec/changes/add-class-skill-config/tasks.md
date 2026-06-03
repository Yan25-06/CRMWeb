## 1. Database migration

- [x] 1.1 Tạo file migration mới `supabase/migrations/20260603xxxxxx_add_class_skill_config_refactor_reviews.sql`
- [x] 1.2 `ALTER TABLE classes ADD COLUMN skill_config jsonb NOT NULL DEFAULT` bộ IELTS 4 kỹ năng thang 0–9
- [x] 1.3 `ALTER TABLE reviews DROP COLUMN listen_score, speak_score, read_score, write_score`
- [x] 1.4 `ALTER TABLE reviews ADD COLUMN scores jsonb NOT NULL DEFAULT '{}'`
- [x] 1.5 Áp migration lên Supabase và xác nhận schema mới

## 2. Service layer

- [x] 2.1 `classService.js`: thêm `skillConfig` vào `fromDB` (fallback bộ mặc định khi null/rỗng) và `toDB`
- [x] 2.2 Tạo helper default skill config (IELTS 4 kỹ năng) dùng chung cho service + UI
- [x] 2.3 `reviewService.js`: đổi `fromDB`/`toDB` từ 4 cột điểm sang `scores` (jsonb keyed theo tên kỹ năng)
- [x] 2.4 Rà các nơi đọc `listenScore/speakScore/readScore/writeScore` từ review và chuyển sang `scores`

## 3. ClassModal — cấu hình kỹ năng

- [x] 3.1 Thêm state `skillConfig` vào `ClassModal`, init từ lớp đang sửa hoặc default
- [x] 3.2 Nhúng `MockTestSectionBuilder` để chỉnh tên/điểm tối đa/thứ tự kỹ năng
- [x] 3.3 Lưu `skillConfig` khi tạo/cập nhật lớp qua `classService`

## 4. ReviewForm — ô nhập điểm động

- [x] 4.1 Nhận `skillConfig` của lớp (qua prop hoặc load theo `classId`)
- [x] 4.2 Thay 4 `ScoreInput` cố định bằng render động theo `skillConfig`
- [x] 4.3 Lưu điểm vào `form.scores` keyed theo tên kỹ năng; validate `0..maxScore` từng kỹ năng
- [x] 4.4 Map edit-mode: nạp `editingReview.scores` vào form đúng theo kỹ năng hiện tại

## 5. RadarChartPanel — trục động + chuẩn hóa

- [x] 5.1 Nhận `skillConfig`, render labels/axes theo danh sách kỹ năng của lớp
- [x] 5.2 Chuẩn hóa điểm về phần trăm `value/maxScore*100`, trục `r` cố định 0–100
- [x] 5.3 Tooltip hiển thị cả điểm gốc lẫn phần trăm
- [ ] 5.4 (Tùy chọn) overlay dataset điểm mock test gần nhất dùng cùng phép chuẩn hóa — bỏ qua (ngoài scope tối thiểu)

## 6. MockTestModal — kế thừa cấu hình lớp

- [x] 6.1 Khi tạo mới, init `sections` từ `skillConfig` của lớp thay cho `DEFAULT_SECTIONS()`
- [x] 6.2 Giữ nguyên khả năng chỉnh tay sections trước khi lưu (không ghi đè khi edit)

## 7. Kiểm thử & tài liệu

- [x] 7.1 Test lớp IELTS mặc định: tạo đánh giá, xem radar, tạo mock test
- [x] 7.2 Test lớp tùy chỉnh (vd 2 kỹ năng thang khác): đánh giá + radar chuẩn hóa đúng
- [x] 7.3 Cập nhật `CLAUDE.md` (model đánh giá/kỹ năng) và `README.md` nếu cần
