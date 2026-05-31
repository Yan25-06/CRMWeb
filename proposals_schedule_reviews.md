# Đề Xuất Phát Triển Tính Năng: Lịch Dạy & Nhận Xét

Tài liệu này ghi lại các đề xuất thiết kế giao diện, tính năng cốt lõi và phương án tích hợp cơ sở dữ liệu cho hai phân hệ **Lịch Dạy** và **Nhận Xét** của ứng dụng **RollCall Manager**.

---

## 1. PHÂN HỆ: LỊCH DẠY (TEACHING SCHEDULE)

Phân hệ Lịch Dạy giúp giáo viên quản lý thời gian giảng dạy, sắp xếp phòng học trực quan và tránh xung đột thời gian dạy học.

### 1.1. Giao Diện Đề Xuất (Weekly & Calendar View)
Giao diện thời khóa biểu dạng lưới 7 ngày trong tuần từ **Thứ Hai đến Chủ Nhật** với các khối ca học màu sắc tương ứng:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [◄] [►]  Tháng 05 / 2026                                 [+ Xếp Lịch]  │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────┤
│ Thứ Hai  │ Thứ Ba   │ Thứ Tư   │ Thứ Năm  │ Thứ Sáu  │ Thứ Bảy  │ CN   │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────┤
│ 17:30    │          │ 17:30    │          │ 17:30    │          │      │
│ [IELTS 1]│          │ [IELTS 1]│          │ [IELTS 1]│          │      │
│ P.102    │          │ P.102    │          │ P.102    │          │      │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────┤
│          │ 19:00    │          │ 19:00    │          │ 19:00    │      │
│          │ [TOEIC 2]│          │ [TOEIC 2]│          │ [TOEIC 2]│      │
│          │ P.105    │          │ P.105    │          │ P.105    │      │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────┘
```

### 1.2. Các Tính Năng Cốt Lõi
1. **Lịch biểu Dạng lưới Tuần (Weekly Grid View)**:
   - Tự động hiển thị lịch dạy cố định của toàn bộ các lớp.
   - Thẻ ca học hiển thị rõ: *Giờ học, Tên lớp, Phòng học, Số lượng học viên hiện tại*.
   - **Color-coded (Mã màu lớp)**: Phân biệt các lớp theo chương trình học (IELTS màu xanh Navy sang trọng, TOEIC màu xanh lục ngọc, Giao tiếp màu vàng hổ phách).
2. **Cảnh báo Xung Đột Lịch (Conflict Checker)**:
   - Khi thêm mới hoặc thay đổi ca dạy, hệ thống tự động kiểm tra trùng lặp:
     * Giáo viên có bị trùng giờ giữa hai lớp khác nhau không.
     * Phòng học (`room`) có bị trùng giữa các ca học cùng giờ hay không.
   - Hiển thị thông báo cảnh báo đỏ nổi bật để ngăn ngừa xếp lịch lỗi.
3. **Lịch Trình Hàng Ngày (Daily Agenda)**:
   - Danh sách nhanh các ca dạy trong ngày hôm nay ở sidebar.
   - Cung cấp phím tắt nhanh để **"Điểm danh nhanh"** hoặc **"Giao bài tập nhanh"** trực tiếp cho ca học hiện tại.

### 1.3. Ánh Xạ Cơ Sở Dữ Liệu (`phf_schedule` & `phf_sessions`)
Dữ liệu sẽ được liên kết trực tiếp với cơ sở dữ liệu có sẵn thông qua:
* **`phf_schedule`**: Lưu lịch cố định hàng tuần.
  ```json
  {
    "id": "schedule_1",
    "classId": "class_ielts_02",
    "dayOfWeek": 1, // Thứ Hai
    "startTime": "19:00",
    "endTime": "20:30",
    "room": "Phòng 102",
    "note": "Lịch học cố định"
  }
  ```
* **`phf_sessions`**: Lưu các buổi học thực tế được tạo ra dựa trên lịch cố định để điểm danh và giao bài tập.

---

## 2. PHÂN HỆ: NHẬN XÉT (STUDENT REVIEWS)

Phân hệ Nhận Xét là cầu nối thông tin chuyên nghiệp giữa Giáo viên và Phụ huynh học sinh, giúp theo dõi sát sao sự tiến bộ học tập.

### 2.1. Giao Diện Đề Xuất (Performance & Remarks Editor)
Giao diện chia làm 2 phần: Bên trái là biểu đồ radar năng lực định kỳ; Bên phải là trình soạn thảo nhận xét buổi học nhanh.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Học viên: NGUYỄN MINH ANH (Lớp IELTS 02)                                │
├────────────────────────────────────────┬───────────────────────────────┤
│ 📊 BIỂU ĐỒ NĂNG LỰC ĐỊNH KỲ             │ 📝 NHẬN XÉT BUỔI HỌC NHANH    │
│                                        │                               │
│                [Speaking: 7.5]         │ [Mẫu soạn sẵn]                │
│                     /   \              │ ┌──────────────────────────┐ │
│         [Writing: 6.5]   [Listening: 6]│ │ 👍 Phát âm chuẩn         │ │
│                     \   /              │ │ 👍 Hăng hái phát biểu    │ │
│                [Reading: 8.0]          │ │ ⚠️ Quên làm bài tập       │ │
│                                        │ └──────────────────────────┘ │
│ Lời khuyên: Cần bổ sung từ vựng chuyên │ [Ghi chú thêm...]            │
│ sâu về chủ đề môi trường và công nghệ. │ Học viên có tiến bộ rõ rệt...│
├────────────────────────────────────────┴───────────────────────────────┤
│                                                [Xuất Phiếu Gửi Phụ Huynh]│
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Các Tính Năng Cốt Lõi
1. **Đánh Giá Kỹ Năng Định Kỳ (Radar Chart Assessment)**:
   - Giáo viên chấm điểm các kỹ năng cốt lõi (Nghe, Nói, Đọc, Viết) theo từng tháng hoặc đợt thi thử.
   - Ứng dụng tự động dựng **Biểu đồ Radar (Radar/Spider Chart)** trực quan sinh động thông qua thư viện `chart.js` có sẵn trong dự án.
   - Thể hiện sự tiến bộ qua các tháng bằng các đường màu sắc xếp đè (VD: Tháng 4 màu đỏ, Tháng 5 màu xanh dương rộng dần ra).
2. **Thẻ Nhận Xét Nhanh Buổi Học (Quick Tag Editor)**:
   - Giáo viên chỉ cần click vào các nhãn đã soạn trước để tạo nhanh câu nhận xét, giảm thiểu việc gõ văn bản thủ công:
     * *Nhãn tích cực*: "Hăng hái", "Phát âm chuẩn", "Làm tốt bài tập", "Hiểu bài nhanh".
     * *Nhãn cần cố gắng*: "Quên bài tập", "Còn thụ động", "Cần luyện viết thêm", "Đến muộn".
3. **Xuất Phiếu Kết Quả Chuyên Nghiệp (Report Card Generator)**:
   - Tính năng tự động kết xuất giao diện nhận xét thành một bức ảnh hoặc tệp PDF trang trí cực kỳ đẹp, cao cấp.
   - Chứa logo trung tâm, bảng điểm, biểu đồ năng lực hình mạng nhện và lời khuyên cá nhân hóa.
   - Cho phép giáo viên tải nhanh xuống để gửi trực tiếp cho Phụ huynh học sinh qua Zalo/Email chỉ bằng 1 cú click chuột.

### 2.3. Ánh Xạ Cơ Sở Dữ Liệu (`phf_reviews` & `phf_session_reviews`)
* **`phf_reviews`**: Lưu trữ đánh giá kỹ năng lớn (Radar Chart, điểm thi thử định kỳ).
  ```json
  {
    "id": "review_1",
    "studentId": "student_01",
    "classId": "class_01",
    "date": "2026-05-30",
    "speakScore": 7.5,
    "writeScore": 6.5,
    "readScore": 8.0,
    "listenScore": 6.0,
    "remark": "Học tốt, đọc hiểu nhanh nhưng phản xạ nghe còn hơi chậm.",
    "teacherName": "Ms.Phương"
  }
  ```
* **`phf_session_reviews`**: Lưu nhận xét thái độ học tập nhanh hàng ngày của học sinh.
