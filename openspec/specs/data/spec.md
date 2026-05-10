# Spec: Data Layer (localStorage)

## Storage Keys
```
phf_students   — danh sách học sinh
phf_classes    — danh sách lớp học
phf_attendance — bản ghi điểm danh
phf_fees       — cấu hình học phí
phf_schedule   — lịch dạy
phf_reviews    — nhận xét học sinh
phf_settings   — cài đặt app
```

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
