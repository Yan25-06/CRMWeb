## ADDED Requirements

### Requirement: Đồng bộ điều hướng vào browser history
Hệ thống SHALL đẩy một entry vào browser history mỗi khi trạng thái điều hướng của app thay đổi (chuyển trang hoặc mở/đóng chi tiết lớp), lưu cặp `{ page, selectedClassId }` vào history state.

#### Scenario: Chuyển trang đẩy history entry
- **WHEN** user chuyển từ Dashboard sang một trang khác (vd Reports) qua Navbar
- **THEN** một entry mới được đẩy vào browser history với state `{ page: 'reports', selectedClassId: null }`

#### Scenario: Mở chi tiết lớp đẩy một entry duy nhất
- **WHEN** user mở chi tiết một lớp (qua Dashboard "Điểm danh", danh bạ học sinh, hoặc danh sách lớp)
- **THEN** chỉ một entry được đẩy với state `{ page: 'classes', selectedClassId: <id> }`
- **AND** một lần Back đưa user thẳng về màn hình xuất phát, không kẹt ở danh sách lớp rỗng

### Requirement: Nút Back/Forward khôi phục màn hình trong app
Hệ thống SHALL lắng nghe sự kiện `popstate` và khôi phục `page` + `selectedClassId` từ history state, thay vì để browser thoát khỏi app.

#### Scenario: Back quay lại màn hình trước
- **WHEN** user đang ở chi tiết lớp và bấm nút Back của trình duyệt
- **THEN** app khôi phục về màn hình trước đó (vd Dashboard) mà không rời khỏi web

#### Scenario: Forward khôi phục màn hình kế tiếp
- **WHEN** user vừa bấm Back rồi bấm Forward của trình duyệt
- **THEN** app khôi phục về màn hình đã rời đi (đúng `page` và `selectedClassId`)

#### Scenario: popstate không có state
- **WHEN** sự kiện `popstate` bắn ra với `event.state` là null
- **THEN** app fallback về trang `dashboard`

### Requirement: Khôi phục state không tạo entry dư
Hệ thống SHALL không đẩy entry mới vào history khi đang khôi phục trạng thái do `popstate`, để tránh vòng lặp điều hướng.

#### Scenario: Back không sinh thêm entry
- **WHEN** app cập nhật `page`/`selectedClassId` do xử lý `popstate`
- **THEN** không có `pushState` nào được gọi trong quá trình khôi phục đó

### Requirement: Khởi tạo history state khi mount
Hệ thống SHALL dùng `replaceState` để gắn trạng thái điều hướng ban đầu (trang mặc định hoặc lớp đang lưu trong localStorage) vào entry hiện hành khi app khởi động.

#### Scenario: Mount với lớp đã persist
- **WHEN** app khởi động và `selectedClassId` được khôi phục từ localStorage
- **THEN** entry history hiện hành được `replaceState` với state phản ánh đúng `page` và `selectedClassId` ban đầu
