# Tasks: Phase 2 — Quản Lý Học Sinh & Lớp Học

## 1. StudentModal component
- [x] 1.1 Tạo `src/components/StudentModal.jsx`
- [x] 1.2 Fields: name, classId (select), grade, phone, feePerSession, note
- [x] 1.3 Validation: name required, classId required
- [x] 1.4 Submit handler: addStudent() hoặc updateStudent() tùy mode
- [x] 1.5 Prefill khi edit mode (student prop)

## 2. ClassModal component
- [x] 2.1 Tạo `src/components/ClassModal.jsx`
- [x] 2.2 Fields: name, level, maxStudents
- [x] 2.3 Validation: name required
- [x] 2.4 Submit: addClass() hoặc updateClass()

## 3. StudentsPage
- [x] 3.1 Tạo `src/pages/StudentsPage.jsx` (thay PlaceholderPages)
- [x] 3.2 State: activeTab ('students' | 'classes'), search, filterClass
- [x] 3.3 Tab switcher UI
- [x] 3.4 Search input với debounce 200ms
- [x] 3.5 Class filter dropdown
- [x] 3.6 Student table với columns đúng spec
- [x] 3.7 Sửa student → mở StudentModal với data
- [x] 3.8 Xóa student → confirm → deleteStudent() → toast
- [x] 3.9 Classes tab: table + ClassModal
- [x] 3.10 Xóa lớp: kiểm tra học sinh còn trong lớp → warn
- [x] 3.11 Empty states cho cả 2 tabs

## 4. Kết nối App.jsx
- [x] 4.1 Import StudentsPage thay PlaceholderPages.StudentsPage
- [x] 4.2 Test toàn bộ CRUD flow

## 5. Cải tiến giao diện Lớp học (Grid Card)
- [x] 5.1 Cập nhật model `Class` (trong db.js seeding và component): thêm `courseType`, `scheduleDays`, `scheduleTime`, `startDate`.
- [x] 5.2 Sửa `ClassModal`: thêm input cho các trường mới.
- [x] 5.3 Sửa tab "Lớp Học" trong `StudentsPage`: đổi từ `table` sang CSS Grid.
- [x] 5.4 Tạo UI component `ClassCard` với tag màu sắc, icon lịch học và ngày khai giảng theo đúng thiết kế mới.
