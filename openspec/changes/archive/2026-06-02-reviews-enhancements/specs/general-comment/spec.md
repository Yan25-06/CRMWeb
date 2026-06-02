## ADDED Requirements

### Requirement: GeneralCommentPanel — nhận xét chung của giáo viên
The system SHALL display a GeneralCommentPanel in Individual mode, below ReviewHistory, with a textarea for the teacher to write a free-form general comment for the selected student.

#### Scenario: Hiển thị panel
- **WHEN** user chọn học viên ở chế độ Cá Nhân
- **THEN** GeneralCommentPanel hiển thị với label "Nhận xét chung của giáo viên" và textarea; nếu có comment đã lưu thì prefill textarea

#### Scenario: Auto-save khi gõ
- **WHEN** user gõ vào textarea và dừng lại 800ms
- **THEN** hệ thống tự động gọi `upsertGeneralComment(studentId, classId, text)`, indicator "Đã lưu" xuất hiện 1.5s rồi biến mất

#### Scenario: Chuyển sang học viên khác
- **WHEN** user click sang học viên khác
- **THEN** textarea load comment của học viên mới (hoặc rỗng nếu chưa có), comment của học viên trước được giữ nguyên trong storage

#### Scenario: Comment rỗng
- **WHEN** user xóa toàn bộ text trong textarea và dừng 800ms
- **THEN** `upsertGeneralComment` được gọi với text = "", record được update (không xóa)

### Requirement: phf_general_comments — data store nhận xét chung
The system SHALL persist general comments in a new localStorage key `phf_general_comments`, one record per student-class pair.

#### Scenario: Cold start
- **WHEN** app khởi động và `phf_general_comments` chưa tồn tại
- **THEN** data layer trả về mảng rỗng, không throw error

#### Scenario: getGeneralComment
- **WHEN** GeneralCommentPanel mount với studentId và classId
- **THEN** `getGeneralComment(studentId, classId)` trả về record tương ứng hoặc null nếu chưa có

#### Scenario: upsertGeneralComment
- **WHEN** `upsertGeneralComment(studentId, classId, text)` được gọi
- **THEN** nếu đã có record thì update `text` và `updatedAt = Date.now()`; nếu chưa có thì tạo mới với `id = uid()`
