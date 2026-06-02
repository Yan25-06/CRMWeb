## 1. mockTestService

- [ ] 1.1 `getByClass(classId)` — bài thi thử theo `class_id`
- [ ] 1.2 `create(data)`, `update(id, data)`, `remove(id)`
- [ ] 1.3 Ánh xạ cột `sections` (jsonb) trực tiếp object/array JS, bỏ parse/stringify thủ công

## 2. mockTestResultService

- [ ] 2.1 `getByTest(mockTestId)`, `getByStudent(studentId, classId)`
- [ ] 2.2 `upsert(data)` — upsert theo `(mock_test_id, student_id)` (`onConflict`), gồm `scores` (jsonb) + `total_score`

## 3. settingsService

- [ ] 3.1 `get()` — cài đặt của `auth.uid()` hoặc giá trị mặc định nếu chưa có
- [ ] 3.2 `upsert(data)` — gán `teacher_id = auth.uid()`, upsert theo `(teacher_id)`

## 4. Banner mất kết nối + retry

- [ ] 4.1 Hook `useOnlineStatus` nghe `navigator.onLine` + sự kiện `online`/`offline`
- [ ] 4.2 Component `OfflineBanner` đặt ở `App.jsx`, hiện khi offline
- [ ] 4.3 Hàng đợi retry in-memory cho thao tác ghi thất bại vì mất mạng; thử lại khi sự kiện `online` bắn; ẩn banner khi thành công

## 5. Chuyển UI mock-test/settings sang service async

- [ ] 5.1 `MockTestTab` — nạp bài thi + kết quả qua service; tạo/sửa/xóa qua service
- [ ] 5.2 `MockTestModal` — tạo/sửa bài thi (sections) qua `mockTestService`
- [ ] 5.3 `MockTestScoreTable` + `StudentTestProfile` — nhập/đọc kết quả qua `mockTestResultService`
- [ ] 5.4 `SettingsPage` — đọc/lưu cài đặt qua `settingsService`; gỡ nút export/import localStorage và `seedDemoData`
- [ ] 5.5 `Navbar` — phần cài đặt đọc qua `settingsService`

## 6. Xóa db.js (cutover)

- [ ] 6.1 Quét toàn repo các import từ `store/db` và `store/mockTestExport`; xác nhận không còn chỗ nào dùng
- [ ] 6.2 Bỏ `seedDemoData` khỏi `App.jsx`; bỏ luồng export/import localStorage khỏi `SettingsPage`
- [ ] 6.3 Xóa `src/store/db.js` và `src/store/mockTestExport.js`
- [ ] 6.4 Chạy build/lint → sửa hết lỗi import còn sót; commit xóa db.js riêng để dễ revert

## 7. Kiểm tra & bàn giao change

- [ ] 7.1 Chạy `openspec validate add-service-tests-settings` và rà từng requirement đã được task/test nào phủ
- [ ] 7.2 Tổng kết cho người dùng: những gì change này đã làm (service layer cho mock-test/settings, banner offline + retry, xóa db.js + localStorage) và những gì CHƯA thuộc phạm vi (Admin Panel ở #10)
- [ ] 7.3 Viết hướng dẫn test thủ công cho người dùng và cùng chạy qua:
  - Đăng nhập teacher A → tạo bài thi thử + nhập điểm → nạp lại trang → dữ liệu vẫn còn (đến từ Supabase, không phải localStorage)
  - Nhập lại điểm cùng học sinh/bài thi → không tạo bản ghi trùng (kiểm Supabase Table Editor)
  - `SettingsPage`: lưu cài đặt → nạp lại → giữ nguyên; không còn nút export/import localStorage
  - Mô phỏng mất mạng (DevTools → Offline) → banner mất kết nối hiện; thao tác ghi chờ; bật mạng lại → tự retry + banner ẩn
  - Xóa localStorage trình duyệt → app vẫn chạy bình thường (không phụ thuộc `phf_*`)
  - Đăng nhập teacher B → bài thi/kết quả/cài đặt của A không xuất hiện
  - `grep` toàn repo: không còn import `store/db`; build sạch
- [ ] 7.4 Ghi lại kết quả test + vấn đề tồn đọng; xác nhận với người dùng trước khi sang #10 (Admin Panel)
