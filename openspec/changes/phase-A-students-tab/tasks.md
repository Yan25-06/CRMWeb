# Tasks: Phase A — Tab Học Viên

## 0. Data Layer
- [x] 0.1 Thêm model StudentEnrollment vào db.js:
        `{ id, studentId, classId, status, goal, note, enrolledAt, pausedAt?, droppedAt? }`
- [x] 0.2 `getEnrollments(classId)` → StudentEnrollment[]
- [x] 0.3 `getEnrollment(studentId, classId)` → StudentEnrollment
- [x] 0.4 `upsertEnrollment(data)` → StudentEnrollment (ghi pausedAt/droppedAt tự động)
- [x] 0.5 `getActiveStudents(classId)` → Student[] (chỉ status='active')
- [x] 0.6 Seed: tạo enrollment cho demo students với status='active'

## 1. Layout ClassDetailPage
- [x] 1.1 Tạo `src/pages/ClassDetailPage.jsx`
- [x] 1.2 Props: `classId`
- [x] 1.3 Header: tên lớp + badge số HS + nút "← Quay lại"
- [x] 1.4 5 tab buttons ngang: Học Viên · Điểm Danh · Bài Tập · Mock Test · Báo Cáo
        (Báo Cáo disabled với tooltip "Sắp có")
- [x] 1.5 Tab content area bên dưới
- [x] 1.6 Kết nối vào App.jsx: route `class-detail` nhận classId

## 2. Component: StudentSidebar
- [x] 2.1 Tạo `src/components/StudentSidebar.jsx`
- [x] 2.2 Props: `enrollments, students, activeId, onSelect`
- [x] 2.3 Search input lọc tên realtime (debounce 200ms)
- [x] 2.4 Filter tabs: Tất cả · Đang học · Tạm ngưng · Đã nghỉ
- [x] 2.5 Count per tab hiển thị dạng "12 · 2 · 1"
- [x] 2.6 Mỗi row: avatar chữ cái (navy-800) + tên + SĐT + badge trạng thái
        - active  → badge-success "Đang học"
        - paused  → badge-warning "Tạm ngưng"
        - dropped → badge-gray   "Đã nghỉ"
- [x] 2.7 Row paused/dropped: opacity-60
- [x] 2.8 Highlight active row: bg-navy-50 border-l-2 border-navy-800
- [x] 2.9 Empty state khi filter không có kết quả

## 3. Component: StudentDetailPanel
- [x] 3.1 Tạo `src/components/StudentDetailPanel.jsx`
- [x] 3.2 Props: `student, enrollment, onEdit`
- [x] 3.3 **Header section:**
        - Avatar lớn (56px) + tên (text-xl font-display) + SĐT
        - Badge trạng thái (click để đổi inline, không cần modal)
        - Mục tiêu: icon target + text, click để edit inline
        - Nút "Sửa thông tin" → mở EnrollmentModal
- [x] 3.4 **4 cards tổng quan** (2×2 grid):
        - Điểm danh: "—/— buổi" (placeholder, Phase B điền)
        - Bài tập: "—/— bài" (placeholder, Phase C điền)
        - Mock test gần nhất: "Chưa có" (placeholder, Phase D điền)
        - Buổi tiếp theo: từ Schedule (nếu có)
- [x] 3.5 **Nhận xét GV** (QuickRemarkInput):
        - Hiện 3 nhận xét gần nhất dạng: [ngày] · [text truncate]
        - Nút "Xem tất cả" → expand accordion lịch sử
        - Textarea "Thêm nhận xét..." + nút Lưu (xuất hiện khi có text)
        - Lưu vào SessionReview với sessionId=null (Phase B sẽ update)
- [x] 3.6 **Timeline 5 hoạt động gần nhất:**
        - Chỉ hiện enrollment events: "Tham gia lớp", "Tạm ngưng", "Tiếp tục học"
        - Placeholder: "Chưa có hoạt động khác — sẽ cập nhật sau khi điểm danh"

## 4. Component: EnrollmentModal
- [x] 4.1 Tạo `src/components/EnrollmentModal.jsx`
- [x] 4.2 Mode: "add" (thêm HS vào lớp) | "edit" (sửa thông tin)
- [x] 4.3 **Mode add:** select HS từ danh sách (chưa enroll vào lớp này)
- [x] 4.4 Fields: Mục tiêu (textarea), Ghi chú nội bộ
- [x] 4.5 **Mode edit:** hiện tên HS (readonly) + Trạng thái (select) + Mục tiêu + Ghi chú
- [x] 4.6 Đổi sang "Tạm ngưng": ghi pausedAt=now, toast "Đã tạm ngưng học viên"
- [x] 4.7 Đổi sang "Đã nghỉ": confirm dialog
        "Học viên này sẽ không nhận bài tập mới. Tiếp tục?"
        → xác nhận: status='dropped', droppedAt=now
- [x] 4.8 Submit → upsertEnrollment() → toast → đóng modal → refresh list

## 5. Tab Học Viên (StudentsTab)
- [x] 5.1 Tạo `src/pages/tabs/StudentsTab.jsx`
- [x] 5.2 Props: `classId`
- [x] 5.3 Load enrollments + students từ db
- [x] 5.4 Layout desktop: sidebar w-72 (fixed) + panel flex-1
- [x] 5.5 Layout mobile: list full-width, tap → slide-in detail (translateX animation)
- [x] 5.6 Nút "+ Thêm học viên" ở header sidebar → EnrollmentModal mode=add
- [x] 5.7 Default: chọn HS đầu tiên trong list (nếu có)
- [x] 5.8 Empty state khi lớp chưa có HS nào

## 6. Polish
- [x] 6.1 Responsive test: 375px, 768px, 1280px
- [x] 6.2 Badge trạng thái click-to-change trong header panel (không cần mở modal)
- [x] 6.3 Mục tiêu edit inline: click text → input → Enter/blur để lưu
- [x] 6.4 Loading skeleton khi fetch data
