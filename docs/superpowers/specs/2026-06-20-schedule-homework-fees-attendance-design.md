# Thiết kế: 4 cải tiến UX (Bài tập · Học phí · Chấm công · Lịch dạy)

**Ngày:** 2026-06-20
**Trạng thái:** Đã duyệt thiết kế, chờ lập kế hoạch triển khai

## Bối cảnh

Bốn thay đổi độc lập nhau, gom chung vì cùng đợt chỉnh sửa UX. #1–#3 không đụng schema/service/migration; #4 cần migration + sửa service layer.

---

## #1 — Bài tập "Theo Buổi": +Thêm khởi tạo "Hoàn tất"

**File:** `src/pages/ClassDetailPage/tabs/HomeworkTab.jsx`

### Hành vi hiện tại
Bấm **+Thêm** ở cột "Kết quả bài tập" tạo bản ghi với `progress: 'not_done'` → badge hiện "Không nộp" đầu tiên.

### Hành vi mong muốn
Bấm **+Thêm** → "Hoàn tất" → bấm tiếp → "Chưa hoàn tất" → bấm tiếp → "Không nộp" → quay vòng.

### Thay đổi
- Trong `handleAddRecord`, đổi `progress: 'not_done'` → `progress: 'done'`.
- **Không** sửa `ProgressBadge.jsx`: vòng lặp `CYCLE = ['done', 'in_progress', 'not_done']` đã đúng thứ tự yêu cầu.

### Phạm vi
Đúng một dòng. Không ảnh hưởng thống kê (`done/in_progress/not_done` vẫn map như cũ).

---

## #2 — Học phí: bỏ "reload" sau khi sửa thanh toán

**File:** `src/pages/FeesPage.jsx` (và đường gọi từ `FeesTable.jsx` → `StudentPaymentHistoryPanel.jsx`)

### Vấn đề
Sau khi sửa/xóa/thêm thanh toán, `refresh()` bật `setLoading(true)` → cả bảng nháy skeleton, gây cảm giác "reload lại trang".

### Thay đổi
- `refresh` nhận tham số: `refresh(silent = false)`.
  - `silent = false` (mặc định, lần tải đầu / đổi tháng-năm): giữ skeleton như cũ.
  - `silent = true`: vẫn `feeService.buildFeesRows(...)` để lấy dữ liệu mới nhất nhưng **không** `setLoading(true)` → bảng đứng yên, số liệu cập nhật tại chỗ.
- `handleSave` (ghi nhận thanh toán) và `onRefresh` (sửa/xóa trong panel lịch sử, qua `FeesTable.reloadHistory`) gọi `refresh(true)`.

### Lý do chọn cách này
Dữ liệu vẫn refetch nên luôn chính xác (paid/expected tính lại đúng); chỉ loại bỏ cú nháy skeleton. Đơn giản, ít rủi ro hơn optimistic update từng dòng.

---

## #3 — Chấm công giáo viên: phương án B trên thẻ lịch tuần

**File chính:** `src/components/schedule/ScheduleCard.jsx`; tái dùng `src/components/schedule/attendanceStatus.js`

### Vấn đề
Nút chấm công hiện là icon `CheckSquare` 11px **chỉ hiện khi rê chuột** (`opacity-0 group-hover:opacity-100`); trạng thái là dòng nhỏ dưới thẻ → khó thấy, dễ bỏ sót trong lưới 7 cột.

### Phương án đã chọn: B — Viền màu trái + chip góc phải
- **Bỏ** icon chấm công chỉ-hiện-khi-rê-chuột. Cũng bỏ icon bút (Edit2) rê-chuột vì bấm thân thẻ đã mở modal sửa lịch (giảm rối, tránh chồng lấn chip).
- **Viền màu bên trái** (`border-l-4`) tô theo trạng thái khi đã chấm: Đã dạy (xanh) / Vắng (đỏ) / Dạy bù (vàng). Chưa chấm: giữ viền thường (không stripe).
- **Chip trạng thái luôn hiện** ở góc trên-phải thẻ:
  - Đã chấm → pill màu (dot + nhãn ngắn: "Đã dạy"/"Vắng"/"Dạy bù").
  - Chưa chấm → chip "Chấm" viền navy nhạt.
  - Bấm chip = gọi `onCheckIn(item, date)` (mở `TeacherAttendanceModal`), có `e.stopPropagation()` để không mở modal sửa lịch.
- Chỉ hiện chip/stripe khi `canCheckAttendance = true` (giữ nguyên gating hiện tại).
- Nếu ca có `note` chấm công → giữ một dòng note nhỏ ở đáy thẻ; bỏ dòng badge trạng thái cũ (đã thể hiện qua chip + stripe).

### Ràng buộc design system
- Màu lấy từ `ATTENDANCE_STATUSES` (`dot`/`text`/`bg`/`border`) trong `attendanceStatus.js` — **không hard-code hex**.
- Chip "chưa chấm" dùng navy tokens (chữ `navy-600` trở lên theo quy tắc tương phản).

### Phạm vi
- Áp dụng cho cả desktop grid và mobile (dùng chung `ScheduleCard`).
- `DailyAgenda.jsx` **giữ nguyên** (đã có nút "Chấm công" rõ ràng kèm nhãn + màu).

---

## #4 — Lịch dạy tự động theo lịch học của lớp (đồng bộ, cùng giờ mọi buổi)

### Vấn đề gốc
Lịch học của lớp đang lưu ở `classes.schedule_days` + `classes.schedule_time` dạng **chữ tự do** (placeholder "VD: Thứ 2-4-6" / "19:00-20:30") — máy không đọc tin cậy được để sinh lịch. Bảng `schedule` (có cấu trúc: `day_of_week`, `start_time`, `end_time`, `room`) mới là nguồn vẽ lưới Lịch Dạy.

### Quyết định
Chuyển lịch học của lớp sang dạng có cấu trúc và **đồng bộ tự động** xuống bảng `schedule` mỗi khi lưu lớp. Cùng giờ cho mọi buổi.

### Data model — migration mới (`classes`)
Thêm cột:
- `schedule_day_list` (jsonb) — mảng thứ trong tuần theo quy ước JS `0=CN … 6=T7` (lớp 3-5-7 → `[2,4,6]`, khớp `schedule.day_of_week`).
- `start_time` (text `HH:MM`), `end_time` (text `HH:MM`).
- `room` (text, nullable) — phòng mặc định gán cho các ca sinh ra.
- Giữ `schedule_days` / `schedule_time` cũ; khi lưu sẽ **tự suy ra** chuỗi hiển thị từ dữ liệu cấu trúc (để chỗ đang dùng `scheduleTime` — như tự điền giờ ở `SessionModal` — vẫn chạy, không phải sửa khắp nơi).
- Cập nhật `supabase/seed/seed_mock_data.sql` cho khớp schema mới (quy tắc ĐỒNG BỘ trong CLAUDE.md).

### Service layer
- `classService.fromDB/toDB`: map thêm `scheduleDayList`, `startTime`, `endTime`, `room`. Khi `toDB`, đồng thời ghi `schedule_days`/`schedule_time` suy ra (hiển thị) để tương thích ngược.
- Thêm `scheduleService.syncForClass(classId, { dayList, startTime, endTime, room })`:
  - Lấy các hàng `schedule` hiện có của `classId`.
  - Mỗi thứ trong `dayList`: **upsert** theo `(class_id, day_of_week)` — cập nhật `start_time`/`end_time`/`room` nếu đã có (giữ nguyên `note`), thêm mới nếu chưa.
  - Thứ **không** còn trong `dayList`: xóa hàng `schedule` của lớp ở thứ đó.
  - Nếu `dayList` rỗng hoặc thiếu giờ: không sinh (no-op), không xóa oan — *(làm rõ: chỉ sync khi có đủ `dayList` + `startTime` + `endTime`; nếu `dayList` rỗng thì không đụng tới các hàng schedule hiện có).*

### ClassModal (`src/components/classes/ClassModal.jsx`)
- "Lịch học (Thứ)" chữ tự do → **nhóm checkbox thứ** (T2…CN), tái dùng nhãn/thứ tự `DAY_OPTIONS` (1=T2 … 0=CN). State: `scheduleDayList` (mảng số).
- "Giờ học" chữ tự do → **2 ô `type="time"`** (giờ bắt đầu / kết thúc), áp dụng chung mọi thứ đã chọn. Validate: kết thúc sau bắt đầu.
- Thêm ô **Phòng** (tùy chọn).
- `onSave` trả về cả `scheduleDayList`, `startTime`, `endTime`, `room`.

### Đường gọi đồng bộ
`ClassModal.onSave` hiện được xử lý ở **2 nơi**: `ClassesOverviewPage.handleSaveClass` (create + update) và `AdminPanelPage.handleCreateClass` (create). Để khỏi lặp logic, gọi `scheduleService.syncForClass(...)` **bên trong** `classService.create` và `classService.update` (sau khi ghi xong hàng `classes`, dùng `id` trả về), chỉ chạy khi có đủ `scheduleDayList` + `startTime` + `endTime`. Như vậy cả hai trang đều tự động đồng bộ mà không cần sửa từng handler. Trang gọi `loadData()` sẵn có để làm tươi lưới/lớp.

Lưu ý coupling: `classService` import `scheduleService` — chấp nhận được (cả hai cùng tầng service). Tránh import vòng bằng cách `scheduleService` không import ngược `classService` (nó đã độc lập).

### Hành vi & ranh giới
- **Cùng giờ mọi buổi** (đúng yêu cầu). Vẫn sửa lẻ từng ca trên lưới (`ScheduleModal`) được; nhưng sửa lại lịch lớp sẽ đồng bộ lại giờ/phòng theo lớp (note riêng từng ca được giữ).
- **Lớp cũ** (chỉ có chữ tự do, chưa có `schedule_day_list`): chưa có lịch tự động cho tới khi admin mở lớp và chọn thứ + giờ. Các ca đã xếp tay trước đó vẫn còn.
- Auto-sync **ghi thẳng**, không chặn theo cảnh báo trùng phòng; xung đột xem lại trên lưới. Modal sửa lẻ vẫn cảnh báo trùng phòng như cũ.
- "Xếp Lịch" thủ công trong trang Lịch Dạy vẫn giữ cho ca lẻ.

---

## Cập nhật tài liệu (sau khi triển khai)
Theo quy tắc bắt buộc trong CLAUDE.md: sau khi làm #4 (đổi data model + service), cập nhật `CLAUDE.md` (mục Model lớp / service layer / migration) và `README.md` phần liên quan.

## Ngoài phạm vi
- Chấm công trên `DailyAgenda` (đã ổn).
- Lịch khác giờ theo từng buổi (đã chọn "cùng giờ mọi buổi").
- Tính học phí theo buổi / optimistic update từng dòng học phí.
