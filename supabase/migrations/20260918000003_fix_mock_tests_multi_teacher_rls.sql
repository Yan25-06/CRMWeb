-- =========================================================================
-- Migration: Fix mock_tests SELECT policy cho multi-teacher-per-class
-- Change: multi-teacher-per-class (bổ sung)
--
-- Migration 20260918000002 chuyển mock_test_results (điểm) sang dùng
-- can_access_class(m.class_id), nhưng bỏ sót bảng CHA `mock_tests` (đề thi).
-- `mock_tests: teacher or admin select` vẫn giữ điều kiện gốc
-- `classes.teacher_id = auth.uid()` (từ 20260602000001) — giáo viên chỉ
-- truy cập lớp qua một ca trong `schedule` (không phải GV phụ trách chính)
-- thấy được enrollments/attendance/homework/mock_test_results của lớp
-- nhưng KHÔNG thấy đề mock_tests, khiến tab Mock Test trắng trơn với đúng
-- kịch bản multi-teacher mà tính năng này hướng tới.
--
-- Write policies của mock_tests (insert/update/delete) đã bị giới hạn
-- admin-only từ migration 20260605000001_restrict_teacher_students_mocktests.sql
-- — migration này KHÔNG đụng tới, chỉ sửa SELECT.
--
-- Rollback: drop policy "mock_tests: teacher or admin select", re-create
-- bản gốc dùng `classes.teacher_id = auth.uid()` từ 20260602000001.
-- =========================================================================

drop policy if exists "mock_tests: teacher or admin select" on public.mock_tests;

create policy "mock_tests: teacher or admin select"
  on public.mock_tests for select
  using (can_access_class(class_id));
