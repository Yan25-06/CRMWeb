## ADDED Requirements

### Requirement: phf_general_comments storage key
The system SHALL add a new localStorage key `phf_general_comments` defaulting to `[]` when absent.

#### Scenario: Cold start với key chưa tồn tại
- **WHEN** app khởi động và `phf_general_comments` chưa có trong localStorage
- **THEN** data layer trả về mảng rỗng, không throw error

### Requirement: GeneralComment data model
The system SHALL define a GeneralComment model stored in `phf_general_comments`.

#### Scenario: Cấu trúc GeneralComment
- **WHEN** `upsertGeneralComment` tạo record mới
- **THEN** record có shape: `{ id: string, studentId: string, classId: string, text: string, updatedAt: number }`

### Requirement: getGeneralComment helper
The system SHALL expose `getGeneralComment(studentId, classId)` returning the matching record or null.

#### Scenario: Record tồn tại
- **WHEN** `getGeneralComment(studentId, classId)` được gọi với composite key đã có
- **THEN** trả về record tương ứng

#### Scenario: Record chưa tồn tại
- **WHEN** `getGeneralComment(studentId, classId)` được gọi với composite key chưa có
- **THEN** trả về null, không throw error

### Requirement: upsertGeneralComment helper
The system SHALL expose `upsertGeneralComment(studentId, classId, text)` that creates or updates the record.

#### Scenario: Record chưa tồn tại — tạo mới
- **WHEN** `upsertGeneralComment` gọi với composite key chưa có
- **THEN** tạo record mới với `id = uid()`, `text`, `updatedAt = Date.now()`, lưu vào `phf_general_comments`

#### Scenario: Record đã tồn tại — cập nhật
- **WHEN** `upsertGeneralComment` gọi với composite key đã có
- **THEN** update `text` và `updatedAt = Date.now()` của record hiện có, giữ nguyên `id`

### Requirement: getAttendanceByRange helper
The system SHALL expose `getAttendanceByRange(studentId, classId, fromDate, toDate)` returning attendance records sorted by date DESC.

#### Scenario: Query trong khoảng ngày
- **WHEN** `getAttendanceByRange(studentId, classId, "2026-01-01", "2026-01-31")` được gọi
- **THEN** trả về tất cả AttendanceRecord có `studentId` và `classId` khớp, `date >= fromDate` và `date <= toDate`, sort by date DESC

### Requirement: getHomeworkByRange helper
The system SHALL expose `getHomeworkByRange(classId, fromDate, toDate)` returning homework records sorted by assignedAt DESC.

#### Scenario: Query trong khoảng ngày
- **WHEN** `getHomeworkByRange(classId, "2026-01-01", "2026-01-31")` được gọi
- **THEN** trả về tất cả Homework của classId với `assignedAt >= fromDate` và `assignedAt <= toDate`, sort by assignedAt DESC
