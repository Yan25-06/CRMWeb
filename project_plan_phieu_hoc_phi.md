# Phiếu Học Phí — Navy Edition
> Web quản lý điểm danh & học phí · React + Vite · localStorage · No login · Deploy miễn phí

---

## Tổng quan dự án

| Mục | Chi tiết |
|---|---|
| **Tên dự án** | Phiếu Học Phí — Navy Edition |
| **Mục tiêu** | Quản lý điểm danh học sinh, thu học phí, lịch dạy, nhận xét — chạy offline, không cần backend |
| **Người dùng** | Giáo viên / trung tâm gia sư nhỏ |
| **Platform** | Web (desktop + mobile responsive), có thể cài như PWA |
| **Thời gian ước tính** | **12–18 ngày làm việc** |
| **Deploy** | Vercel hoặc Netlify (miễn phí) |

---

## Stack quyết định

| Công nghệ | Vai trò |
|---|---|
| **React + Vite** | UI framework, build tool nhanh |
| **Tailwind CSS** | Utility-first styling, Navy theme tokens |
| **localStorage** | Lưu trữ dữ liệu phía client, không cần server |
| **Chart.js** | Biểu đồ dashboard (doanh thu, chuyên cần) |
| **html2canvas** | Xuất phiếu học phí sang ảnh PNG |
| **Vercel / Netlify** | Deploy miễn phí, CI/CD tự động từ GitHub |

---

## Palette màu Navy/White

| Token | Hex | Dùng cho |
|---|---|---|
| Navy đậm | `#0F2044` | Header, Sidebar |
| Navy vừa | `#1B3A6B` | Primary buttons, primary actions |
| Navy nhạt | `#2E5FA3` | Hover states, accents, links |
| Xanh rất nhạt | `#E8EEF7` | Page background, card backgrounds |
| Trắng | `#FFFFFF` | Surface cards, input fields |

---

## Cấu trúc thư mục

```
src/
├── components/           # UI primitives dùng lại
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Table.jsx
│   ├── Modal.jsx
│   ├── Badge.jsx
│   └── Sidebar.jsx
│
├── pages/                # Các màn hình chính
│   ├── Dashboard.jsx
│   ├── Attendance.jsx
│   ├── Fees.jsx
│   ├── Schedule.jsx
│   └── Reviews.jsx
│
├── hooks/                # Custom hooks giao tiếp với store
│   ├── useStudents.js
│   ├── useAttendance.js
│   ├── useFees.js
│   ├── useSchedule.js
│   └── useReviews.js
│
├── store/                # localStorage helpers
│   ├── storage.js        # get / set / remove wrappers
│   └── schema.js         # Định nghĩa cấu trúc dữ liệu
│
└── theme/                # Design tokens
    ├── colors.js         # Navy color constants
    └── tailwind.config.js
```

---

## Roadmap 5 Phase

---

### Phase 1 — Setup & Design System
**Thời gian:** ~1–2 ngày

**Mục tiêu:** Dựng khung dự án, thiết lập design system Navy, tạo component library cơ bản.

**Công việc cụ thể:**

- [ ] Khởi tạo project: `npm create vite@latest . -- --template react`
- [ ] Cài Tailwind CSS, cấu hình `tailwind.config.js` với Navy color tokens
- [ ] Tạo CSS variables cho palette (`--navy-dark`, `--navy-mid`, `--navy-light`...)
- [ ] Dựng các component dùng lại:
  - `Button` (variants: primary, secondary, ghost, danger)
  - `Card` (shadow, border Navy nhạt)
  - `Table` (striped rows, sortable header)
  - `Modal` (overlay, close button)
  - `Badge` (trạng thái: Đã đóng / Chưa đóng / Có mặt / Vắng)
- [ ] Layout chính: Sidebar Navy đậm + Content area trắng
- [ ] Setup React Router cho navigation giữa các trang

**Output:** Project chạy được, Storybook hoặc demo page hiển thị đủ components.

---

### Phase 2 — Data Layer (localStorage)
**Thời gian:** ~1–2 ngày

**Mục tiêu:** Thiết kế schema dữ liệu và viết toàn bộ lớp persistence với localStorage.

**Schema dữ liệu:**

```js
// students
{ id, name, phone, class_id, joined_date, note }

// classes
{ id, name, teacher, schedule, fee_per_month }

// attendance
{ id, student_id, class_id, date, status } // status: present | absent | late

// fees
{ id, student_id, class_id, month, amount, paid, paid_date, note }

// schedule
{ id, class_id, day_of_week, start_time, end_time, room }

// reviews
{ id, student_id, class_id, date, speaking_score, writing_score, note }
```

**Công việc cụ thể:**

- [ ] Viết `storage.js`: wrapper `getStore(key)`, `setStore(key, data)`, `updateItem()`, `deleteItem()`
- [ ] Custom hooks:
  - `useStudents()` — CRUD học sinh
  - `useAttendance()` — điểm danh theo ngày/lớp
  - `useFees()` — quản lý học phí
  - `useSchedule()` — lịch dạy
  - `useReviews()` — nhận xét học sinh
- [ ] Seed data mẫu để test (10 học sinh, 2 lớp, 1 tháng attendance)
- [ ] Viết hàm `exportJSON()` và `importJSON()` để backup/restore toàn bộ data

**Output:** Tất cả hooks hoạt động, data persist sau khi reload trang.

---

### Phase 3 — Core Features
**Thời gian:** ~4–6 ngày *(Quan trọng nhất)*

**Mục tiêu:** Xây dựng 3 tính năng cốt lõi: Dashboard, Điểm danh, Học phí.

#### 3A. Dashboard
- [ ] Tổng số học sinh đang học
- [ ] Doanh thu tháng hiện tại (tổng học phí đã thu)
- [ ] Tỉ lệ chuyên cần trung bình (%)
- [ ] Số học sinh chưa đóng học phí tháng này
- [ ] Biểu đồ Chart.js:
  - Line chart: doanh thu theo 6 tháng gần nhất
  - Bar chart: chuyên cần từng lớp theo tuần
- [ ] Quick actions: "Điểm danh hôm nay", "Xem nợ học phí"

#### 3B. Điểm danh (`/attendance`)
- [ ] Chọn lớp + ngày điểm danh
- [ ] Hiển thị danh sách học sinh trong lớp
- [ ] Chấm: **Có mặt** / **Vắng** / **Trễ** (toggle nhanh)
- [ ] Lưu điểm danh theo batch (1 lần submit cho cả lớp)
- [ ] Xem lịch sử: bảng điểm danh theo tháng, filter theo học sinh
- [ ] Tính % chuyên cần cho từng học sinh
- [ ] Export bảng điểm danh ra CSV

#### 3C. Học phí (`/fees`)
- [ ] Danh sách học phí theo tháng — mặc định tháng hiện tại
- [ ] Filter: theo lớp, theo trạng thái (Đã đóng / Chưa đóng)
- [ ] Đánh dấu đã thu học phí (1 click)
- [ ] Ghi chú khi thu (số tiền thực tế, hình thức thanh toán)
- [ ] **Xuất phiếu học phí** (dùng html2canvas):
  - Template phiếu đẹp, có logo, tên học sinh, tháng, số tiền
  - Xuất PNG, có thể in hoặc gửi zalo

**Output:** 3 tính năng hoạt động end-to-end với dữ liệu thật.

---

### Phase 4 — Extended Features
**Thời gian:** ~4–5 ngày

**Mục tiêu:** Thêm tính năng nâng cao: Nhận xét, Lịch dạy, Quản lý học sinh/lớp.

#### 4A. Nhận xét học sinh (`/reviews`)
- [ ] Nhập điểm nói (Speaking) và điểm viết (Writing) theo buổi học
- [ ] Ghi chú nhận xét tự do
- [ ] Xem lịch sử nhận xét của 1 học sinh (timeline)
- [ ] Biểu đồ tiến độ điểm theo thời gian (line chart)
- [ ] Export nhận xét ra Excel (dùng SheetJS hoặc CSV)

#### 4B. Lịch dạy (`/schedule`)
- [ ] Xem lịch theo ngày / tuần / tháng (calendar view)
- [ ] Thêm / sửa / xóa buổi dạy
- [ ] Hiển thị: lớp, phòng, giờ bắt đầu-kết thúc, giáo viên
- [ ] Click vào buổi → nhanh chóng điểm danh hoặc xem học sinh

#### 4C. Quản lý học sinh & lớp (`/students`)
- [ ] CRUD đầy đủ cho học sinh: thêm, sửa, xóa, tìm kiếm
- [ ] CRUD lớp học: tên lớp, học phí/tháng, lịch, giáo viên
- [ ] Assign học sinh vào lớp (có thể học nhiều lớp)
- [ ] Xem hồ sơ học sinh: thông tin, lịch sử học phí, điểm danh, nhận xét
- [ ] Chấm công giáo viên: ghi nhận buổi dạy theo ngày

**Output:** Đầy đủ 3 tính năng mở rộng, UI nhất quán với Phase 3.

---

### Phase 5 — Polish & Deploy
**Thời gian:** ~2–3 ngày

**Mục tiêu:** Hoàn thiện UX, tối ưu mobile, deploy lên production.

**Công việc cụ thể:**

- [ ] **PWA**: Thêm `manifest.json`, service worker cơ bản → cài được lên màn hình điện thoại
- [ ] **Responsive mobile**: Kiểm tra và sửa layout trên màn hình nhỏ (sidebar → bottom nav)
- [ ] **Backup/Restore**: UI hoàn chỉnh cho xuất/nhập JSON — nút "Sao lưu dữ liệu" ở Settings
- [ ] **Animation & Polish**:
  - Transition khi chuyển trang (fade)
  - Loading skeleton khi render danh sách lớn
  - Toast notification khi lưu thành công/thất bại
  - Confirm dialog trước khi xóa
- [ ] **Kiểm tra toàn bộ flow**:
  - Thêm học sinh → gán vào lớp → điểm danh → thu học phí → xuất phiếu
  - Import JSON backup → dữ liệu phục hồi đúng
- [ ] **Deploy**:
  - Push code lên GitHub
  - Connect với Vercel hoặc Netlify
  - Cấu hình custom domain (tùy chọn)
  - Kiểm tra build production

**Output:** Web chạy ổn định trên cả desktop và mobile, có link share được.

---

## Checklist tổng thể

### Tính năng bắt buộc (MVP)
- [ ] Dashboard tổng quan
- [ ] Điểm danh theo buổi
- [ ] Quản lý học phí theo tháng
- [ ] Xuất phiếu học phí PNG
- [ ] CRUD học sinh & lớp
- [ ] Backup/Restore JSON

### Tính năng nâng cao
- [ ] Nhận xét & chấm điểm
- [ ] Lịch dạy (calendar view)
- [ ] Chấm công giáo viên
- [ ] Biểu đồ Chart.js
- [ ] Export Excel
- [ ] PWA installable

---

## Rủi ro & Giải pháp

| Rủi ro | Giải pháp |
|---|---|
| localStorage bị xóa (clear browser) | Nhắc người dùng backup JSON thường xuyên; hiển thị banner cảnh báo |
| Dữ liệu lớn làm localStorage chậm | Giới hạn 1–2 năm dữ liệu; cung cấp tính năng archive |
| Nhiều thiết bị dùng chung | Hướng dẫn export/import để sync thủ công |
| html2canvas render sai | Test trên Chrome trước; fallback xuất CSV |

---

## Lệnh khởi động nhanh

```bash
# Tạo project
npm create vite@latest phieu-hoc-phi -- --template react
cd phieu-hoc-phi

# Cài dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npm install react-router-dom chart.js react-chartjs-2 html2canvas

# Khởi tạo Tailwind
npx tailwindcss init -p

# Chạy dev
npm run dev

# Build production
npm run build
```

---

*Cập nhật lần cuối: theo SVG Project Plan — Navy Edition*
