## ADDED Requirements

### Requirement: Đổi mật khẩu với xác minh mật khẩu cũ

Trang Cài Đặt SHALL cung cấp section "Đổi Mật Khẩu" cho mọi user. Trước khi đổi, hệ thống SHALL xác minh mật khẩu hiện tại qua re-authenticate Supabase (`signInWithPassword`). Mật khẩu mới SHALL tối thiểu 6 ký tự và phải khớp với ô xác nhận.

#### Scenario: Vào form đổi mật khẩu

- **WHEN** user bấm "Chỉnh sửa" ở section đổi mật khẩu
- **THEN** hiện 3 ô: mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới, kèm nút "Lưu" và "Hủy"

#### Scenario: Đổi mật khẩu thành công

- **WHEN** user nhập đúng mật khẩu hiện tại, mật khẩu mới hợp lệ và xác nhận khớp, rồi bấm "Lưu"
- **THEN** hệ thống gọi `signInWithPassword(email, mật_khẩu_cũ)` để xác minh
- **AND** sau khi xác minh thành công gọi `updateUser({ password: mật_khẩu_mới })`
- **AND** hiện toast thành công và reset form về read-only

#### Scenario: Mật khẩu hiện tại sai

- **WHEN** user nhập sai mật khẩu hiện tại và bấm "Lưu"
- **THEN** `signInWithPassword` lỗi, hệ thống báo "Mật khẩu hiện tại không đúng" và không đổi mật khẩu

#### Scenario: Mật khẩu mới quá ngắn

- **WHEN** mật khẩu mới ngắn hơn 6 ký tự
- **THEN** hệ thống báo lỗi và không gọi Supabase

#### Scenario: Xác nhận không khớp

- **WHEN** ô xác nhận không khớp với mật khẩu mới
- **THEN** hệ thống báo lỗi "Mật khẩu xác nhận không khớp" và không gọi Supabase

#### Scenario: Hủy đổi mật khẩu

- **WHEN** user bấm "Hủy"
- **THEN** form được xóa trống và trở về read-only
