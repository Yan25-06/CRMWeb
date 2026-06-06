## ADDED Requirements

### Requirement: Runbook triển khai production
Dự án SHALL cung cấp một runbook triển khai (tài liệu) liệt kê đầy đủ các bước cấu hình bắt buộc trên Supabase mà code không tự thực hiện được, để người vận hành làm theo trước khi go-live. Runbook SHALL bao gồm: bootstrap admin, cấu hình Auth URL, chặn tự đăng ký, bật backup, và kiểm thử phân quyền.

#### Scenario: Người vận hành làm theo runbook
- **WHEN** người vận hành chuẩn bị go-live và mở runbook
- **THEN** runbook cung cấp các bước tuần tự, đánh dấu rõ bước nào là thủ công trên Supabase Dashboard và bước nào do code xử lý

### Requirement: Bootstrap tài khoản admin
Hệ thống SHALL hỗ trợ tạo tài khoản admin đầu tiên một cách an toàn: cờ `is_admin` chỉ được đặt qua truy cập SQL trực tiếp (SQL Editor/psql), không qua API. Runbook SHALL ghi rõ quy trình mời admin rồi set `is_admin = true` bằng SQL.

#### Scenario: Set is_admin qua SQL
- **WHEN** người vận hành chạy lệnh SQL set `is_admin = true` cho tài khoản admin trong SQL Editor
- **THEN** hệ thống áp dụng thay đổi (trigger không chặn vì request không có JWT claims)

#### Scenario: Thử đổi is_admin qua API bị chặn
- **WHEN** một request qua API (PostgREST) cố đổi `is_admin`
- **THEN** hệ thống từ chối với lỗi quyền

### Requirement: Cấu hình xác thực cho domain production
Runbook SHALL yêu cầu đặt Site URL và Redirect URLs trong Supabase trùng với domain triển khai để liên kết invite và reset mật khẩu hoạt động, và SHALL yêu cầu tắt tự đăng ký để chỉ admin mời người dùng mới.

#### Scenario: Liên kết invite/recovery hợp lệ
- **WHEN** Redirect URLs đã trỏ đúng domain production
- **THEN** người dùng mở liên kết invite/recovery được đưa về app đúng domain để hoàn tất

#### Scenario: Người lạ không tự đăng ký được
- **WHEN** tự đăng ký bị tắt và một người lạ cố tạo tài khoản
- **THEN** hệ thống từ chối tạo tài khoản mới ngoài luồng mời của admin

### Requirement: Sao lưu dữ liệu và kiểm thử phân quyền trước go-live
Runbook SHALL yêu cầu bật sao lưu dữ liệu định kỳ trên Supabase trước khi nhập liệu thật, và SHALL yêu cầu kiểm thử bằng một tài khoản giáo viên thường để xác nhận UI khớp với RLS (giáo viên read-only trên `students` và `mock_tests`, vẫn ghi được điểm/điểm danh/bài tập).

#### Scenario: Backup được bật trước khi nhập liệu thật
- **WHEN** người vận hành hoàn tất runbook trước go-live
- **THEN** sao lưu định kỳ đã được bật cho dự án Supabase

#### Scenario: Kiểm thử tài khoản giáo viên thường
- **WHEN** đăng nhập bằng tài khoản giáo viên không phải admin
- **THEN** UI ẩn mọi nút thêm/sửa/xóa học sinh và đề mock test, nhưng vẫn cho nhập điểm, điểm danh và bài tập
