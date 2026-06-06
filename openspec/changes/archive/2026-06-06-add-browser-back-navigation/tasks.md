## 1. Hạ tầng đồng bộ history trong App.jsx

- [x] 1.1 Thêm `useRef` cờ `isPopstate` để phân biệt cập nhật do user vs do popstate
- [x] 1.2 Viết hàm trung tâm `pushNavState({ page, selectedClassId })` gọi `window.history.pushState({ page, selectedClassId }, '')`, bỏ qua khi `isPopstate.current === true`
- [x] 1.3 Thêm `useEffect` mount chạy một lần: `replaceState` với state ban đầu (`page` hiện tại + `selectedClassId` từ localStorage)

## 2. Gắn sync vào các điểm điều hướng

- [x] 2.1 `handleNavigate(newPage)`: sau khi `setPage`, gọi `pushNavState({ page: newPage, selectedClassId })` (giữ nguyên guard admin/fees)
- [x] 2.2 Mở chi tiết lớp từ Dashboard (`onAttendance`): gộp set `selectedClassId` + `page='classes'` thành một `pushNavState({ page: 'classes', selectedClassId: classId })`
- [x] 2.3 Mở chi tiết lớp từ danh bạ (`onNavigateToClass`) và từ danh sách lớp (`onSelectClass`): cùng đẩy một entry `{ page: 'classes', selectedClassId: id }`
- [x] 2.4 `onBack` của `ClassDetailPage` (về list): `setSelectedClassId(null)` + `pushNavState({ page: 'classes', selectedClassId: null })`

## 3. Xử lý popstate

- [x] 3.1 Thêm `useEffect` đăng ký listener `popstate`; trong handler bật `isPopstate.current = true`, đọc `event.state` (fallback `{ page: 'dashboard', selectedClassId: null }` khi null), gọi `setPage` + `setSelectedClassId`, rồi tắt cờ
- [x] 3.2 Cleanup listener khi unmount
- [x] 3.3 Đảm bảo effect persist `selectedClassId → localStorage` hoạt động đúng cả khi khôi phục null (back về list)

## 4. Kiểm thử thủ công

- [x] 4.1 Dashboard → Reports → Back: quay về Dashboard, không thoát web
- [x] 4.2 Dashboard → "Điểm danh" (mở ClassDetail) → Back: về thẳng Dashboard, không kẹt ở danh sách lớp
- [x] 4.3 Danh bạ học sinh → mở lớp → Back: về danh bạ
- [x] 4.4 ClassDetail → onBack (nút trong app) → Back của browser: hành vi nhất quán, không thoát web ngoài ý muốn
- [x] 4.5 Back rồi Forward: khôi phục đúng màn hình kế tiếp
- [x] 4.6 F5 trên một lớp đang mở (localStorage) rồi Back: không thoát web bất ngờ
- [x] 4.7 Build `npm run build` chạy được, không lỗi

## 5. Cập nhật tài liệu

- [x] 5.1 Cập nhật CLAUDE.md mục "Routing & Layout": ghi rõ routing state vẫn dùng `useState` nhưng đã đồng bộ browser history (back/forward hoạt động trong app)
- [x] 5.2 Cập nhật README.md nếu có phần mô tả điều hướng
