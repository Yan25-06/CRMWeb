## ADDED Requirements

### Requirement: Storage keys for payments, homework, and submissions
The system SHALL add three new localStorage keys: `phf_payments`, `phf_homework`, `phf_submissions`, each defaulting to `[]` when absent.

#### Scenario: Cold start with empty storage
- **WHEN** app khởi động và localStorage chưa có key `phf_payments` / `phf_homework` / `phf_submissions`
- **THEN** data layer trả về mảng rỗng cho từng key, không throw error

#### Scenario: Read tolerates missing fields on legacy records
- **WHEN** đọc một record cũ thiếu field mới (vd Student thiếu `feePerSession`)
- **THEN** data layer trả về record với field đó gán giá trị default (0 hoặc null), không crash

### Requirement: Payment record model
The system SHALL store each tuition payment as an independent record in `phf_payments`.

Mỗi Payment có shape:
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

### Requirement: Homework definition model
The system SHALL store homework assignments as records in `phf_homework`.

Mỗi Homework có shape:
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

### Requirement: Submission record model
The system SHALL store per-student submission status for each homework as records in `phf_submissions`.

Mỗi Submission có shape:
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
