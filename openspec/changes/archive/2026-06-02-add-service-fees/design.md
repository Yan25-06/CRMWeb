## Context

Change service-layer thứ tư, sau #4 (lớp/học sinh), #5 (buổi học/điểm danh), #6 (homework). Nhóm học phí gồm hai bảng: `fees` (trạng thái theo `student_id` + `year` + `month`, có `fee_per_session`/`surcharge`/`paid`) và `payments` (lịch sử thanh toán theo `student_id`, có `period`/`amount`/`method`). RLS suy quyền qua `student_id`/`class_id` (#3). `calcFee` hiện phụ thuộc số buổi học (`countSessions`) đã lên Supabase ở #5.

## Goals / Non-Goals

**Goals:**
- Service async cho fees/payments theo cùng quy ước #4–#6.
- Chuyển các component học phí sang nạp async.
- Giữ logic tính tiền nhất quán với hành vi hiện có.

**Non-Goals:**
- Optimistic UI cho học phí — dùng load-then-confirm (tần suất thấp).
- Banner offline + retry (thuộc #9).
- Xóa `db.js`.

## Decisions

**1. Hai file service, cùng quy ước các change trước.**
`feeService`, `paymentService` export hàm async bọc `supabase.from(...)`, ném `Error` khi lỗi, không filter quyền ở client (RLS lo).

**2. `calcFee` tính client từ số buổi đã nạp.**
`calcFee(studentId, year, month)` lấy số buổi học của tháng (qua `attendanceService`/`sessionService` từ #5) rồi nhân `fee_per_session` + `surcharge`. Tránh nhân đôi logic ở DB; giữ công thức ở một chỗ trong service.

**3. `isFeePaid` đọc từ bản ghi `fees` đã upsert.**
Trạng thái `paid` là nguồn chân lý; `isFeePaid` trả `fees.paid` theo `(student_id, year, month)`, không suy từ tổng payments để tránh lệch khi có phụ phí/giảm trừ.

**4. `period` của payments giữ định dạng chuỗi hiện có.**
Không đổi format `period` (ví dụ `"2026-06"`); service truyền/đọc nguyên giá trị để tương thích dữ liệu và UI hiện tại.

## Risks / Trade-offs

- **Tính tiền lệch nếu công thức cũ tinh tế** — `calcFee` cũ ở `db.js` có thể có quy tắc đặc thù (làm tròn, miễn buổi vắng…). Mitigation: đọc kỹ logic `calcFee`/`countSessions` cũ và sao đúng vào service trước khi gỡ `db.js`.
- **Phụ thuộc #5 cho số buổi** — `calcFee` cần dữ liệu buổi học/điểm danh đã lên Supabase. #5 đã xong nên ổn; nếu chạy lệch thứ tự sẽ tính sai.
- **Trạng thái hỗn hợp** với reviews/mock-test chưa migrate — chấp nhận vì mock data, các nhóm đó ở #8/#9.
