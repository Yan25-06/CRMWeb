## MODIFIED Requirements

### Requirement: Storage keys for payments, homework, and submissions
Tầng dữ liệu localStorage SHALL được thay thế hoàn toàn bằng Supabase (PostgreSQL). Các storage key `phf_*` và truy cập trực tiếp `src/store/db.js` KHÔNG còn là nguồn dữ liệu chính; dữ liệu cho payments, homework, submissions và mọi entity khác SHALL lưu trong các bảng PostgreSQL tương ứng, truy cập qua service layer (`src/services/`). File `src/store/db.js` và logic localStorage liên quan SHALL bị xóa.

#### Scenario: Cold start không còn đọc localStorage
- **WHEN** app khởi động sau khi cutover
- **THEN** hệ thống nạp dữ liệu từ Supabase qua service layer, không đọc các key `phf_*`

#### Scenario: Không migrate dữ liệu cũ
- **WHEN** triển khai backend mới
- **THEN** hệ thống bắt đầu với dữ liệu trống; dữ liệu mock trong localStorage cũ KHÔNG được nhập vào

#### Scenario: Không còn import db.js
- **WHEN** quét toàn bộ codebase sau cutover
- **THEN** không file nào còn import từ `src/store/db.js` và file đó đã bị xóa
