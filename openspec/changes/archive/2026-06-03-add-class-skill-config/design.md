## Context

Mô hình `reviews` dùng 4 cột điểm cố định (`listen_score`, `speak_score`, `read_score`, `write_score`), còn `mock_test_results` dùng `scores` jsonb keyed theo tên section. Hai cấu trúc lệch nhau nên không thể chia sẻ định nghĩa kỹ năng hay đối chiếu điểm. `mock_tests.sections` đã là jsonb dạng `[{ id, name, maxScore, order }]` và có sẵn UI builder (`MockTestSectionBuilder`). Project chưa có dữ liệu thật quan trọng nên migration không cần bảo toàn dữ liệu cũ.

## Goals / Non-Goals

**Goals:**
- Một nguồn định nghĩa kỹ năng duy nhất ở cấp lớp (`classes.skill_config`).
- `reviews.scores` dùng cùng cấu trúc jsonb keyed-by-name với mock test → cho phép đối chiếu.
- Review form & radar chart render động theo cấu hình lớp, không hardcode 4 kỹ năng.
- Mock test mới kế thừa skill config của lớp làm sections mặc định.

**Non-Goals:**
- Không bảo toàn / migrate dữ liệu `reviews` cũ.
- Không xử lý đổi tên kỹ năng sau khi đã có dữ liệu (chấp nhận mất matching nếu đổi tên).
- Không gộp `reviews` và `mock_test_results` thành một bảng — vẫn là hai khái niệm tách biệt (đánh giá định kỳ của GV vs kết quả thi thử).

## Decisions

### 1. Skill config đặt ở `classes`, không phải `settings` (cấp giáo viên)
Một giáo viên có thể dạy cả IELTS lẫn TOEIC. Đặt ở lớp cho phép mỗi lớp có bộ kỹ năng riêng. Trade-off: phải set lại mỗi lớp, nhưng có default IELTS nên đa số không cần đụng tới.

### 2. `scores` jsonb keyed theo **tên kỹ năng**, không phải id
Mock test result đã keyed theo tên section trong `scores`. Giữ nhất quán: `reviews.scores = { "Listening": 7.5, "Reading": 6.0 }`. Đổi tên kỹ năng sẽ mất matching — chấp nhận được vì là rủi ro hiếm và đã ghi ở Non-Goals.

### 3. Migration thẳng tay (drop + add), không giữ dữ liệu
Vì chưa có dữ liệu quan trọng:
```sql
-- classes
ALTER TABLE classes ADD COLUMN skill_config jsonb NOT NULL DEFAULT
  '[{"name":"Listening","maxScore":9,"order":0},
    {"name":"Reading","maxScore":9,"order":1},
    {"name":"Writing","maxScore":9,"order":2},
    {"name":"Speaking","maxScore":9,"order":3}]';
-- reviews
ALTER TABLE reviews DROP COLUMN listen_score, DROP COLUMN speak_score,
  DROP COLUMN read_score, DROP COLUMN write_score;
ALTER TABLE reviews ADD COLUMN scores jsonb NOT NULL DEFAULT '{}';
```
Đặt tên file migration tiếp theo dãy hiện có (`20260603xxxxxx_...`).

### 4. Radar chart normalize về %
Các kỹ năng có thể khác `maxScore` (vd Listening 40, Speaking 9). Vẽ raw sẽ lệch trục. Chuẩn hóa `value/maxScore*100`, trục `r` cố định 0–100, tooltip hiện cả raw lẫn %. Cho phép overlay dataset Mock Test gần nhất dùng cùng phép chuẩn hóa.

### 5. Mặc định an toàn ở mọi tầng
`skillConfig` rỗng/null → fallback về default IELTS 4 kỹ năng trong service `fromDB`, để lớp cũ và code đọc luôn có giá trị hợp lệ.

## Risks / Trade-offs

- **Đổi tên kỹ năng làm mất matching điểm cũ** → Chấp nhận; có thể khóa đổi tên khi lớp đã có review (cải tiến sau, ngoài scope).
- **Mock test sections có thể lệch khỏi class skill_config** (GV chỉnh tay) → Chấp nhận; sections của mock test độc lập sau khi tạo, class config chỉ là giá trị khởi tạo.
- **`scores` keyed-by-name khác `maxScore` giữa review và mock test** (cùng tên "Listening" nhưng thang khác nhau) → Khi overlay normalize theo maxScore tương ứng của từng nguồn, không so sánh raw.

## Migration Plan

1. Tạo 1 file SQL migration: add `classes.skill_config`, refactor `reviews`.
2. Cập nhật `classService` (map `skillConfig`) và `reviewService` (map `scores`).
3. Cập nhật UI: `ClassModal`, `ReviewForm`, `RadarChartPanel`, `MockTestModal`.
4. Rollback: drop cột `skill_config`, đảo lại `reviews` về 4 cột (data sẽ mất — đã chấp nhận).
