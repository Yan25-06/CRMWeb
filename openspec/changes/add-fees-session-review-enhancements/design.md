## Context

Ba cải tiến độc lập, thuần client-side, không đụng schema DB hay service layer. Mỗi cải tiến nằm gọn trong một vùng UI riêng nên không có rủi ro chéo. Dữ liệu cần thiết cho cả ba đều đã có sẵn trong code hiện tại:

- `feeService.buildFeesRows(year, month)` trả về mỗi row có `className`.
- `classService` đã map `scheduleTime` (free-text như `"19:00-20:30"`); `ClassDetailPage` đã load `currentClass` đầy đủ.
- `ReviewsPage` đã có `mocksByStudent` (Map `studentId → [{result, mockTest}]` đã sort mới nhất trước) dùng cho overview table; mock result dùng chung tên kỹ năng với `skillConfig` của lớp.

## Goals / Non-Goals

**Goals:**
- Lọc học phí theo lớp ở `FeesPage`, kết hợp bộ lọc trạng thái sẵn có và xuất Excel.
- Điền sẵn giờ buổi học mới theo lịch lớp, có fallback an toàn.
- Điền sẵn điểm + nhận xét cho đánh giá mới từ mock test gần nhất, cho phép xóa.

**Non-Goals:**
- Không thay đổi schema, service layer, routing.
- Không chuẩn hóa định dạng `scheduleTime` (vẫn là free-text); chỉ parse best-effort.
- Không tự động đồng bộ khi mock test thay đổi sau khi form đã mở.
- Không đụng chế độ edit của SessionModal/ReviewForm.

## Decisions

### 1. Lọc học phí theo lớp — client-side, dropdown riêng
Dùng `Select` từ `@/components/ui`, options = `['Tất cả lớp', ...uniqueClassNames]` suy từ `rows`. State `classFilter` mới. Áp dụng thứ tự: lọc lớp → lọc trạng thái → tính `tabCounts`/summary trên tập đã lọc lớp, để bộ đếm trạng thái phản ánh đúng lớp đang chọn.

*Alternative cân nhắc:* lọc theo `classId` thay vì `className`. Bỏ vì `buildFeesRows` hiện chỉ expose `className`; dùng tên là đủ và tránh đổi service. Rủi ro trùng tên lớp thấp trong phạm vi một giáo viên/trung tâm.

### 2. Giờ buổi học mặc định — prop `scheduleTime` truyền xuống, parse trong SessionModal
Truyền chuỗi `scheduleTime` thay vì hai prop giờ rời, để logic parse tập trung một chỗ. Chain: `ClassDetailPage` (đã có `currentClass`) → `AttendanceTab` + `HomeworkTab` → `SessionModal`. Parse bằng regex `^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$`; không khớp → fallback `08:00`/`09:30`. Chỉ áp dụng trong nhánh create của `useEffect` hiện có; nhánh edit giữ nguyên.

*Alternative:* parse ở parent rồi truyền `defaultStartTime`/`defaultEndTime`. Bỏ vì phân tán logic ra nhiều tab.

### 3. Pre-fill ReviewForm — prop `latestMockEntry`, init trong useEffect create
`ReviewsPage` truyền `latestMockEntry = mocksByStudent.get(selectedStudentId)?.[0] ?? null` (entry đầu = mới nhất do đã sort). Trong `ReviewForm`, nhánh create của `useEffect` (khi `open && !editingReview`): nếu có `latestMockEntry`, set `form.scores` lọc theo các skill name có trong `skillConfig`, set `form.remark = result.teacherNote`, và bật state `prefillSource = { title, date }`. Badge hiển thị khi `prefillSource` còn; nút X gọi `setForm(EMPTY_FORM)` + `setPrefillSource(null)`.

*Map điểm:* chỉ copy `scores[skillName]` khi `skillName` tồn tại trong `skillConfig` của lớp, tránh rác từ mock test có section lệch tên.

## Risks / Trade-offs

- **Trùng tên lớp trong filter học phí** → Phạm vi một giáo viên hiếm trùng; nếu trùng, hai lớp cùng tên gộp chung — chấp nhận được, không gây sai số tiền.
- **`scheduleTime` định dạng lạ** (vd `"7h-8h30"`) → regex không khớp → fallback mặc định, không vỡ form.
- **Mock test gần nhất có teacherNote rỗng** → `remark` để trống, badge vẫn hiện (đã điền điểm) — chấp nhận; giáo viên xóa được bằng nút X.
- **Tên kỹ năng mock test lệch `skillConfig`** → điểm lệch bị bỏ qua (không điền), không gây lỗi.
