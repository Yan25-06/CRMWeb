# Tasks: Phase D — Tab Mock Test

## 0. Data Layer
- [ ] 0.1 Thêm model MockTest:
        `{ id, classId, title, date, sections: MockTestSection[], teacherNote?, createdAt }`
- [ ] 0.2 Thêm model MockTestSection (embedded trong MockTest):
        `{ id, name, maxScore, order }`
- [ ] 0.3 Thêm model MockTestResult:
        `{ id, mockTestId, studentId, scores: { [sectionId]: number }, totalScore, teacherNote?, createdAt, updatedAt }`
- [ ] 0.4 `getMockTests(classId)` → MockTest[] sort theo date DESC
- [ ] 0.5 `createMockTest(data)` → MockTest
        side-effect: tạo MockTestResult rỗng (`scores: {}`) cho tất cả active students
- [ ] 0.6 `updateMockTest(id, data)` → MockTest (cập nhật title/date/sections/teacherNote)
- [ ] 0.7 `deleteMockTest(id)` → void (cascade xóa MockTestResult)
- [ ] 0.8 `getMockTestResults(mockTestId)` → MockTestResult[]
- [ ] 0.9 `getResultsByStudent(studentId, classId)` → MockTestResult[] (join MockTest để có date)
- [ ] 0.10 `upsertMockTestResult(data)` → MockTestResult
        tự tính totalScore = sum(Object.values(scores))
        tự cập nhật updatedAt

## 1. Component: MockTestSectionBuilder
- [ ] 1.1 Tạo `src/components/MockTestSectionBuilder.jsx`
- [ ] 1.2 Props: `sections, onChange`
- [ ] 1.3 Default sections khi tạo mới:
        [Listening/40, Reading/40, Writing/40, Speaking/40]
- [ ] 1.4 Mỗi row: [input tên section] [input maxScore] [nút xóa 🗑]
- [ ] 1.5 Validate: tên không rỗng, maxScore > 0 và là số nguyên
- [ ] 1.6 Nút "+ Thêm phần thi" ở cuối list
- [ ] 1.7 Tối thiểu 1 section (không cho xóa nếu chỉ còn 1)
- [ ] 1.8 Reorder: nút ↑↓ per row để đổi thứ tự

## 2. Component: MockTestModal
- [ ] 2.1 Tạo `src/components/MockTestModal.jsx`
- [ ] 2.2 Mode: "create" | "edit"
- [ ] 2.3 Fields:
        - Tên bài kiểm tra (text, required) — VD: "Mock Test 1"
        - Ngày thi (date, required)
        - MockTestSectionBuilder
        - Nhận xét chung của GV (textarea, optional)
- [ ] 2.4 Edit mode: warn nếu đã có results
        "Thay đổi phần thi có thể ảnh hưởng điểm đã nhập. Tiếp tục?"
- [ ] 2.5 Submit create → createMockTest() → toast "Đã tạo Mock Test!"
- [ ] 2.6 Submit edit → updateMockTest() → toast "Đã cập nhật!"

## 3. Component: ScoreInputRow
- [ ] 3.1 Tạo `src/components/ScoreInputRow.jsx`
- [ ] 3.2 Props: `sections, scores, onChange`
- [ ] 3.3 Mỗi section → 1 input number:
        - placeholder "—"
        - min=0, max=section.maxScore
        - width cố định (60px)
- [ ] 3.4 Validate khi blur: nếu > maxScore → đặt lại maxScore + toast warn
- [ ] 3.5 Auto-save khi blur → gọi onChange(newScores)
- [ ] 3.6 Cột cuối: tổng tự tính realtime (sum scores nhập được / sum maxScore)
        hiển thị: "XXX / YYY"
- [ ] 3.7 Score chưa nhập: không tính vào tổng (bỏ qua, không coi là 0)

## 4. Component: MockTestScoreTable (bảng điểm cả lớp)
- [ ] 4.1 Tạo `src/components/MockTestScoreTable.jsx`
- [ ] 4.2 Props: `mockTest, results, students, onResultChange`
- [ ] 4.3 Header: [Tên HS] [Section1] [Section2] ... [Tổng] [%] [Nhận xét GV]
- [ ] 4.4 Mỗi row: [avatar+tên] [ScoreInputRow] [totalScore] [%] [textarea nhận xét per HS]
- [ ] 4.5 textarea nhận xét: auto-save blur, debounce 800ms
- [ ] 4.6 Footer row: [Trung bình lớp] [avg per section] [avg total]
- [ ] 4.7 HS chưa có result: hiện inputs rỗng, onChange tạo result mới
- [ ] 4.8 Handle orphan section: section bị xóa khỏi MockTest nhưng có score cũ
        → hiện cột "(Đã xóa)" với giá trị cũ, readonly, màu gray

## 5. Component: StudentTestProfile (hồ sơ thi)
- [ ] 5.1 Tạo `src/components/StudentTestProfile.jsx`
- [ ] 5.2 Props: `student, mockTests, results`
- [ ] 5.3 Header: avatar + tên HS
- [ ] 5.4 Danh sách mock tests dạng accordion (mỗi test = 1 card)
- [ ] 5.5 Card collapsed: tên test + ngày + tổng điểm badge
- [ ] 5.6 Card expanded:
        - Bảng [Section · Điểm nhập · Tối đa · %]
        - Nhận xét GV riêng cho HS này (textarea, auto-save)
- [ ] 5.7 Line chart điểm tổng theo thời gian:
        - Chỉ render nếu có ≥ 2 kết quả
        - x-axis: ngày thi, y-axis: tổng điểm
        - Chart.js LineChart, màu navy-600
        - Lazy render (chỉ hiện khi scroll đến)

## 6. Export Functions
- [ ] 6.1 `exportMockTestExcel(mockTest, results, students)` → download XLSX
        - Sheet 1 "Điểm thi": header=[Tên, ...sections, Tổng, %], rows=per HS
        - Sheet 2 "Nhận xét GV": header=[Tên, Nhận xét], rows=per HS
        - Tên file: `mocktest_[tên lớp]_[tên test]_[ngày].xlsx`
- [ ] 6.2 `exportStudentResultText(student, mockTest, result, centerName)` → download TXT
        Template:
        ```
        [Tên Trung Tâm]
        Kết quả Mock Test: [Tên Test]
        Học viên: [Tên HS]    Ngày thi: DD/MM/YYYY

        [Section 1]  : XX / YY
        [Section 2]  : XX / YY
        [Section 3]  : XX / YY
        [Section 4]  : XX / YY
        ──────────────────────
        Tổng         : XXX / YYY (ZZ%)

        Nhận xét của giáo viên:
        [teacherNote riêng cho HS này]
        ```
        Tên file: `ketqua_[ten-hs]_[ten-test].txt`

## 7. Tab Mock Test (MockTestTab)
- [ ] 7.1 Tạo `src/pages/tabs/MockTestTab.jsx`
- [ ] 7.2 Props: `classId`
- [ ] 7.3 Layout: StudentSidebar (trái, w-56) + main panel (phải)
- [ ] 7.4 Sidebar: danh sách HS active + "Tổng quan lớp" ở đầu
        Mỗi HS hiện điểm tổng của test gần nhất (hoặc "Chưa thi")
- [ ] 7.5 **Main panel — Tổng quan lớp** (mặc định, khi không chọn HS):
        - Header: "Mock Tests" + nút "Tạo Mock Test mới"
        - Danh sách MockTest cards:
          [tên test] · [ngày] · [X phần thi] · [avg lớp] · [nút sửa] [nút xóa]
        - Click card → expand MockTestScoreTable bên dưới card
        - Nút "Xuất Excel" per test (ở góc card)
- [ ] 7.6 **Main panel — Hồ sơ thi HS** (khi click tên HS ở sidebar):
        - StudentTestProfile component
        - Nút "Xuất Text" per test trong accordion
- [ ] 7.7 Empty state: "Chưa có bài kiểm tra nào. Tạo mock test đầu tiên?"
- [ ] 7.8 Xóa MockTest: confirm "Xóa bài kiểm tra và toàn bộ điểm của học viên?"

## 8. Update Phase A sau khi xong Phase D
- [ ] 8.1 StudentDetailPanel card "Mock test gần nhất": điền data thật
        từ getResultsByStudent() → test mới nhất → totalScore / maxTotal
- [ ] 8.2 Timeline (Phase A): thêm mock test events
        VD: "📊 5/5 — Mock Test 1: 120/160 (75%)"
