## ADDED Requirements

### Requirement: CurrencyInput định dạng tiền tệ VND theo thời gian thực
Thư viện UI (`@/components/ui`) SHALL cung cấp component `CurrencyInput` để nhập số tiền VND. Component SHALL hiển thị placeholder `000đ`, tự chèn dấu chấm phân tách hàng nghìn theo thời gian thực khi người dùng gõ, và hiển thị giá trị đã có sẵn ở dạng đã định dạng (`1.400.000đ`). Component SHALL chỉ chấp nhận chữ số (lọc bỏ mọi ký tự khác) và SHALL trả về giá trị dạng **số nguyên** qua `onChange` (ví dụ `1400000`), không phải chuỗi đã định dạng.

#### Scenario: Gõ số chèn dấu chấm theo thời gian thực
- **WHEN** người dùng gõ lần lượt `1`, `4`, `0`, `0` vào `CurrencyInput`
- **THEN** ô hiển thị lần lượt `1` → `14` → `140` → `1.400`

#### Scenario: Trả về giá trị số nguyên
- **WHEN** người dùng nhập `1.400.000`
- **THEN** callback `onChange` nhận giá trị `1400000` (số nguyên)

#### Scenario: Hiển thị giá trị đã lưu
- **WHEN** `CurrencyInput` nhận `value = 1400000`
- **THEN** ô hiển thị `1.400.000` (đã chèn dấu chấm)

#### Scenario: Lọc ký tự không hợp lệ
- **WHEN** người dùng gõ ký tự không phải chữ số (chữ cái, ký hiệu)
- **THEN** ký tự đó bị bỏ qua, chỉ giữ lại các chữ số
