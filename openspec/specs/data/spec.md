# Spec: Data Layer (localStorage)

## Storage Keys
```
phf_students    — danh sách học sinh
phf_classes     — danh sách lớp học
phf_attendance  — bản ghi điểm danh
phf_fees        — cấu hình học phí
phf_schedule    — lịch dạy
phf_reviews     — nhận xét học sinh
phf_settings    — cài đặt app
phf_payments    — khoản thu học phí (default: [])
phf_homework    — bài tập được giao (default: [])
phf_submissions — bản ghi nộp bài của học sinh (default: [])
```

### Requirement: Storage keys for payments, homework, and submissions
The system SHALL add three new localStorage keys: `phf_payments`, `phf_homework`, `phf_submissions`, each defaulting to `[]` when absent.

#### Scenario: Cold start with empty storage
- **WHEN** app khởi động và localStorage chưa có key `phf_payments` / `phf_homework` / `phf_submissions`
- **THEN** data layer trả về mảng rỗng cho từng key, không throw error

#### Scenario: Read tolerates missing fields on legacy records
- **WHEN** đọc một record cũ thiếu field mới (vd Student thiếu `feePerSession`)
- **THEN** data layer trả về record với field đó gán giá trị default (0 hoặc null), không crash

## Data Models

### Student
```typescript
{
  id: string          // uid()
  name: string        // Họ và tên
  grade: string       // Lớp (VD: "Lớp 5")
  classId: string     // FK → Class.id
  feePerSession: number // Học phí/buổi (đ)
  phone?: string      // SĐT phụ huynh
  note?: string       // Ghi chú
  createdAt: number   // timestamp
}
```

### Class
```typescript
{
  id: string
  name: string        // Tên lớp (VD: "Anh Văn Cơ Bản")
  level?: string      // Trình độ (VD: "A1", "B2")
  maxStudents?: number
  createdAt: number
}
```

### AttendanceRecord
```typescript
{
  id: string
  studentId: string   // FK → Student.id
  classId: string     // FK → Class.id
  date: string        // "YYYY-MM-DD"
  present: boolean    // true = có mặt
  note?: string       // ghi chú vắng
}
```

### FeeRecord
```typescript
{
  id: string
  studentId: string
  year: number
  month: number       // 1-12
  feePerSession: number
  surcharge: number   // Phụ phí
  paid: boolean
  paidAt?: number     // timestamp
  note?: string
}
```

### ScheduleItem
```typescript
{
  id: string
  classId: string
  dayOfWeek: number   // 0=CN, 1=T2... 6=T7
  startTime: string   // "HH:MM"
  endTime: string     // "HH:MM"
  room?: string
  note?: string
}
```

### ReviewRecord
```typescript
{
  id: string
  studentId: string
  classId: string
  date: string        // "YYYY-MM-DD"
  speakScore?: number // Điểm nói (0-10)
  writeScore?: number // Điểm viết (0-10)
  remark?: string     // Nhận xét
  absent?: boolean
  absentReason?: string
}
```

### Settings
```typescript
{
  teacherName: string
  centerName: string
  defaultFeePerSession: number
  currency: string    // "đ"
}
```

### Payment
```typescript
{
  id: string          // uid()
  studentId: string   // FK → Student.id
  classId: string     // FK → Class.id
  amount: number      // số tiền (đ)
  paidAt: string      // "YYYY-MM-DD"
  method: "cash" | "transfer"
  period: string      // "YYYY-MM" (tháng học phí áp dụng)
  note?: string
  createdAt: number
}
```

#### Scenario: Tạo payment mới
- **WHEN** user submit form ghi nhận thu tiền với đủ field bắt buộc
- **THEN** record được push vào `phf_payments` với `id` mới và `createdAt = Date.now()`

#### Scenario: Query payments theo học viên
- **WHEN** ReportsPage hoặc FeesPage cần danh sách thanh toán của 1 học viên
- **THEN** data layer trả về tất cả Payment có `studentId` tương ứng, sort theo `paidAt` desc

### Homework
```typescript
{
  id: string
  classId: string     // FK → Class.id
  title: string
  description?: string
  assignedAt: string  // "YYYY-MM-DD"
  dueDate?: string    // "YYYY-MM-DD"
  createdAt: number
}
```

#### Scenario: Tạo homework cho lớp
- **WHEN** user thêm bài tập mới trong HomeworkTab với `title` không rỗng
- **THEN** record được lưu vào `phf_homework` gắn với `classId` hiện tại

### Submission
```typescript
{
  id: string
  homeworkId: string  // FK → Homework.id
  studentId: string   // FK → Student.id
  submitted: boolean  // đã nộp hay chưa
  score?: number      // điểm (0-10)
  comment?: string    // nhận xét của giáo viên
  gradedAt?: number   // timestamp khi giáo viên chấm
}
```

#### Scenario: Đánh dấu học viên đã nộp
- **WHEN** giáo viên tick checkbox "đã nộp" cho 1 học viên trong bảng nộp bài
- **THEN** Submission tương ứng (homeworkId × studentId) được upsert với `submitted = true`; nếu chưa có record, tạo mới

#### Scenario: Chấm điểm + nhận xét
- **WHEN** giáo viên nhập điểm và/hoặc nhận xét cho 1 học viên
- **THEN** Submission được cập nhật, `gradedAt = Date.now()`

#### Scenario: Cascade khi xóa Homework hoặc Student
- **WHEN** user xóa 1 Homework
- **THEN** tất cả Submission có `homeworkId` đó cũng bị xóa
- **WHEN** user xóa 1 Student
- **THEN** hỏi confirm và cascade xóa Payment + Submission liên quan

## Business Logic

### Requirement: Tính học phí
- sessions = count(attendance WHERE studentId AND month AND present=true)
- total = sessions × feePerSession + surcharge
- Hiển thị format: Intl.NumberFormat('vi-VN') + "đ"

### Requirement: Dashboard stats
- totalStudents = count(students)
- totalClasses = count(classes)
- presentToday = count(attendance WHERE date=today AND present=true)
- monthlyRevenue = sum(calcFee) cho tất cả students trong tháng
- yearlyRevenue = sum(calcFee) cho tất cả students trong năm

### Requirement: Export/Import
- Export: JSON file toàn bộ data với version field
- Import: parse JSON, overwrite từng key
- Filename: `phieuhocphi_backup_DD-MM-YYYY.json`

### Requirement: Demo Data
- Seed 2 lớp, 6 học sinh khi app lần đầu mở (students.length === 0)
- Seed attendance cho 10 ngày của tháng hiện tại
- Seed fee records với feePerSession: 150000
