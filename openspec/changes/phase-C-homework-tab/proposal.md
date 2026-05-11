# Proposal: Phase C — Tab Bài Tập

## Status: 🔲 TODO (sau Phase B)

## Intent
Xây dựng tab "Bài Tập": mỗi buổi học (Session) tự động có 1 bài tập
per học viên. GV cập nhật tiến độ (3 mức) và ghi chú per học viên.

## Scope
- HomeworkRecord đã được tạo tự động bởi Phase B (createSession side-effect)
- Hiển thị bảng bài tập per session: tên bài + tiến độ per HS + ghi chú
- Toggle tiến độ 3 mức: Không làm (0) → Đang làm (50) → Hoàn thành (100)
- GV có thể đặt tên bài tập chung cho cả lớp (per session)
- Summary footer: thống kê nhanh + progress bar
- Update cards tổng quan ở tab Học Viên (Phase A)

## Out of Scope
- Đính kèm file bài tập
- Học viên tự cập nhật tiến độ (chỉ GV)

## Dependencies
- Phase B: Session phải có, HomeworkRecord đã được createSession tạo stub
- Phase A: StudentDetailPanel card "Bài tập" sẽ được update sau

## Approach
- SessionSelector dùng lại component từ Phase B
- ProgressBadge: click để cycle (không cần nút save)
- Tên bài tập shared: 1 input ở header bảng, lưu vào Session.topic hoặc HomeworkRecord.title chung
- Ghi chú per HS: collapse mặc định, expand khi click icon, auto-save khi blur
