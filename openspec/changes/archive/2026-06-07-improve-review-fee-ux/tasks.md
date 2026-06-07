## 1. Xóa phiếu nhận xét

- [x] 1.1 Thêm method `remove(id)` vào `src/services/reviewService.js` (delete theo id, throw khi lỗi)
- [x] 1.2 `ReviewHistory.jsx`: thêm prop `onDelete(review)` + nút xóa (`Trash2`) trên mỗi item, `stopPropagation` để không trigger `onEdit`
- [x] 1.3 `ReviewsPage.jsx`: thêm state `deletingReview`, render `ConfirmModal`, xác nhận → `reviewService.remove` → reload danh sách + `toast.success`
- [x] 1.4 Kiểm thử: tạo phiếu, xóa có xác nhận, hủy xóa giữ nguyên

## 2. CurrencyInput

- [x] 2.1 Tạo `src/components/ui/CurrencyInput.jsx`: controlled, `value` số nguyên, `onChange(int)`, placeholder `000đ`, suffix `đ`, `inputMode="numeric"`, format dấu chấm real-time
- [x] 2.2 Export `CurrencyInput` qua `@/components/ui` (index.jsx)
- [x] 2.3 Kiểm thử: gõ `1400000` hiển thị `1.400.000`, onChange trả `1400000`, lọc ký tự lạ

## 3. Áp dụng CurrencyInput vào form học phí

- [x] 3.1 `PaymentModal.jsx`: thay ô "Số tiền" `type="number"` bằng `CurrencyInput` (giữ validate > 0, gửi số nguyên)
- [x] 3.2 `EnrollmentModal.jsx`: thay TẤT CẢ ô học phí (component `FeeInputs` + các block inline cho `monthlyFee`/`courseFee`) bằng `CurrencyInput`
- [x] 3.3 Kiểm thử: tạo thanh toán, tạo & sửa ghi danh — giá trị lưu đúng số nguyên

## 4. Ô sĩ số gõ thẳng

- [x] 4.1 `ClassModal.jsx`: ô `maxStudents` chuyển `type="text"` + `inputMode="numeric"`, lọc non-digit trong `onChange`, lưu số nguyên
- [x] 4.2 Kiểm thử: gõ số trực tiếp được, không cần spinner, ký tự lạ bị bỏ

## 5. skillConfig bỏ maxScore

- [x] 5.1 `classService.js`: đổi `DEFAULT_SKILL_CONFIG` sang `[{ name, order }]`; `fromDB/toDB` chỉ map `name` + `order`, bỏ qua `maxScore`
- [x] 5.2 `MockTestSectionBuilder.jsx`: thêm prop `showMaxScore = true`; ẩn ô điểm tối đa khi `false`
- [x] 5.3 `ClassModal.jsx`: truyền `showMaxScore={false}`; `toSkillConfig` chỉ ghi `{ name, order }`
- [x] 5.4 `MockTestModal.jsx`: khi init sections từ `skillConfig` (không còn maxScore) → gán `maxScore` mặc định `9`
- [x] 5.5 Kiểm thử: tạo/sửa lớp không có ô điểm tối đa; tạo mock test vẫn có ô điểm tối đa với default 9

## 6. Thang điểm phiếu nhận xét từ mock test gần nhất

- [x] 6.1 Migration `supabase/migrations/<timestamp>_add_reviews_score_max.sql`: `ALTER TABLE reviews ADD COLUMN score_max jsonb NOT NULL DEFAULT '{}';`
- [x] 6.2 `reviewService.js`: `fromDB/toDB` map `scoreMax ↔ score_max`
- [x] 6.3 `ReviewForm.jsx`: maxScore mỗi kỹ năng theo ưu tiên edit→`editingReview.scoreMax`, create→mock test sections, fallback `9`; khi tạo mới lưu `scoreMax` snapshot vào `onSave`
- [x] 6.4 `ReviewsPage.jsx`: tính `maxScoreMap` từ `latestMockEntry.mockTest.sections` truyền xuống `ReviewForm`
- [x] 6.5 `ReviewsPage.jsx`: ẩn/khóa nút "Thêm đánh giá" + helper text khi học sinh chưa có mock test (`!latestMockEntry`)
- [x] 6.6 Kiểm thử: tạo đánh giá điền sẵn điểm+thang từ mock test; chỉnh sửa giữ nguyên thang lúc tạo; học sinh chưa có mock test không tạo được

## 7. Đồng bộ seed & tài liệu

- [x] 7.1 `supabase/seed/seed_mock_data.sql`: bỏ `maxScore` khỏi `skill_config` mẫu, thêm `score_max` cho review mẫu khớp scores
- [x] 7.2 Cập nhật `CLAUDE.md` (mục "Model đánh giá kỹ năng") và `README.md` phần liên quan
- [x] 7.3 Chạy `npm run build` đảm bảo không lỗi
