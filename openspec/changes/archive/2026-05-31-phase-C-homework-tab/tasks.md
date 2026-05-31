# Tasks: Phase C — Tab Bài Tập

## 0. Data Layer
- [x] 0.1 Confirm HomeworkRecord đã có từ Phase B createSession()
        `{ id, sessionId, studentId, classId, title?, progress: 0|50|100, note?, createdAt, updatedAt }`
- [x] 0.2 `getHomework(sessionId)` → HomeworkRecord[] (tất cả HS trong session đó)
- [x] 0.3 `getHomeworkByStudent(studentId, classId)` → HomeworkRecord[] (toàn bộ lịch sử)
- [x] 0.4 `updateHomework(id, { progress?, title?, note? })` → HomeworkRecord
        tự cập nhật updatedAt = Date.now()
- [x] 0.5 `updateSessionHomeworkTitle(sessionId, title)` → void
        cập nhật title cho TẤT CẢ HomeworkRecord trong session đó
- [x] 0.6 `getHomeworkStats(studentId, classId)` → { done, inProgress, notDone, total }
        done = count(progress=100), inProgress = count(50), notDone = count(0)

## 1. Component: ProgressBadge
- [x] 1.1 Tạo `src/components/ProgressBadge.jsx`
- [x] 1.2 Props: `progress (0|50|100), onChange, disabled`
- [x] 1.3 Render:
        - 0   → badge-danger   "Không làm"
        - 50  → badge-warning  "Đang làm"
        - 100 → badge-success  "Hoàn thành"
- [x] 1.4 Click → cycle: 0 → 50 → 100 → 0
- [x] 1.5 Gọi onChange(newProgress) → caller tự save
- [x] 1.6 disabled: không click được, opacity-60
- [x] 1.7 Animation: brief scale bounce khi cycle

## 2. Component: HomeworkNoteCell
- [x] 2.1 Tạo `src/components/HomeworkNoteCell.jsx`
- [x] 2.2 Props: `note, onSave`
- [x] 2.3 Mặc định: hiện icon 📝 + text truncate (hoặc "—" nếu rỗng)
- [x] 2.4 Click icon → expand thành textarea (2 rows)
- [x] 2.5 Auto-save khi blur (không cần nút lưu)
- [x] 2.6 Debounce 800ms trước khi gọi onSave()
- [x] 2.7 Visual: border-bottom animate khi focus

## 3. Component: HomeworkSummaryFooter
- [x] 3.1 Tạo `src/components/HomeworkSummaryFooter.jsx`
- [x] 3.2 Props: `records (HomeworkRecord[])`
- [x] 3.3 Tính: done, inProgress, notDone từ records
- [x] 3.4 Hiển thị: "✓ Hoàn thành: X · ⏳ Đang làm: Y · ✗ Không làm: Z"
- [x] 3.5 Progress bar tổng:
        score = (done×100 + inProgress×50) / (total×100) × 100
        bar màu: navy-600 fill trên navy-100 bg
- [x] 3.6 Update realtime khi bất kỳ ProgressBadge nào thay đổi

## 4. Tab Bài Tập (HomeworkTab)
- [x] 4.1 Tạo `src/pages/tabs/HomeworkTab.jsx`
- [x] 4.2 Props: `classId`
- [x] 4.3 **Toolbar:**
        - SessionSelector (reuse từ Phase B)
        - Input "Tên bài tập hôm nay..." (shared cho cả lớp)
          → onChange debounce 600ms → updateSessionHomeworkTitle(sessionId, title)
          → prefill từ HomeworkRecord[0].title của session đang chọn
- [x] 4.4 **Empty state** khi chưa có session: "Chưa có buổi học. Tạo buổi ở tab Điểm Danh"
- [x] 4.5 **Empty state** khi session không có HS active: "Không có học viên nào"
- [x] 4.6 **Bảng bài tập:**
        - Col 1: Avatar + Tên HS
        - Col 2: ProgressBadge (click → cycle → auto-save updateHomework)
        - Col 3: HomeworkNoteCell (auto-save)
- [x] 4.7 HS paused: hiện trong bảng, opacity-50, ProgressBadge disabled
- [x] 4.8 HS dropped: ẩn khỏi bảng
- [x] 4.9 Prefill: khi đổi session → load HomeworkRecord tương ứng từ db
- [x] 4.10 Auto-save ProgressBadge:
        click → updateHomework(id, { progress: newValue }) → toast mini "Đã lưu" (1.5s)
- [x] 4.11 **HomeworkSummaryFooter** sticky ở cuối bảng
- [x] 4.12 Thêm thủ công: nếu HS active nhưng không có HomeworkRecord trong session
        (edge case: HS thêm vào lớp SAU khi session được tạo)
        → hiện nút "+ Thêm bài tập" cho HS đó → tạo HomeworkRecord mới

## 5. Update Phase A sau khi xong Phase C
- [x] 5.1 StudentDetailPanel card "Bài tập": điền data thật
        từ getHomeworkStats(studentId, classId)
        hiện "X/Y hoàn thành (Z%)"
- [x] 5.2 Timeline (Phase A): thêm homework events
        VD: "📝 12/5 — Bài tập Buổi 3: Hoàn thành"
