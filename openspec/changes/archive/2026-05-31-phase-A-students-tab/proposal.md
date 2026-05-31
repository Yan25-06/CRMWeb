# Proposal: Phase A — Tab Học Viên

## Status: 🔲 TODO

## Intent
Xây dựng tab "Học Viên" trong màn lớp học: danh sách học viên với
trạng thái, mục tiêu, và panel chi tiết tổng hợp khi bấm vào tên.
Đây là nền tảng data (StudentEnrollment) cho 3 tab sau dùng chung.

## Scope
- Data model StudentEnrollment (trạng thái, mục tiêu)
- Sidebar danh sách học viên + filter theo trạng thái
- Panel chi tiết: header + 4 cards tổng quan + nhận xét nhanh + timeline
- Modal thêm/sửa học viên trong lớp
- Đổi trạng thái (active → paused → dropped) với confirm

## Out of Scope
- Cards tổng quan sẽ hiện placeholder (data chưa có vì tab khác chưa làm)
- Timeline chỉ hiện dữ liệu từ Enrollment, chưa có attendance/homework
- Không làm báo cáo

## Dependencies
- db.js từ Phase 1 (students, classes đã có)
- Cần thêm: StudentEnrollment model vào db.js

## Approach
- Layout split: sidebar cố định + panel phải scroll
- Mobile: list → tap → full-screen detail (back button)
- QuickRemarkInput dùng SessionReview stub (lưu tạm, Phase B sẽ link vào Session)
