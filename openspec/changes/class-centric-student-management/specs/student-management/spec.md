# Spec: Student Management (Modified)

## MODIFIED Requirements

### Requirement: Student data structure
The system SHALL store student records with the following fields: name, grade/khối, phone (parent contact), fee per session, class enrollment.

#### Scenario: Create student
- **WHEN** user creates a new student via StudentModal (in ClassDetailPage Học Viên tab)
- **THEN** system saves student with: name (required), classId, grade, phone, feePerSession
- AND student appears in the class's Học Viên list

#### Scenario: Edit student
- **WHEN** user clicks edit on a student in any class's Học Viên tab
- **THEN** system opens StudentModal with all student data prefilled
- AND changes to student (name, phone, grade, fee) apply globally and are visible in all classes the student is enrolled in

### Requirement: Add student to class
The system SHALL support adding students to a class through two flows: create new student + enroll, or enroll existing student.

#### Scenario: Create and enroll new student
- **GIVEN** user is in ClassDetailPage Học Viên tab for "TOEIC 02"
- **WHEN** user clicks "Thêm học sinh mới" button
- **THEN** system opens StudentModal with current class (TOEIC 02) prefilled in classId field
- AND user fills in student details (name required, optional: grade, phone, fee)
- AND user clicks Save
- **THEN** student is created with classId = "TOEIC 02"
- AND student appears in the Học Viên list
- AND modal closes with success toast

#### Scenario: Enroll existing student
- **GIVEN** user is in ClassDetailPage Học Viên tab for "TOEIC 02"
- **WHEN** user clicks "Thêm học sinh hiện có" button
- **THEN** system displays a selector/list of all students NOT currently in "TOEIC 02"
- AND user selects a student and confirms enrollment
- **THEN** student is enrolled in "TOEIC 02" (classId is updated to "TOEIC 02")
- AND student appears in the Học Viên list

### Requirement: List students in class context
The system SHALL display students enrolled in a specific class with ability to edit or remove them.

#### Scenario: View students in class
- **WHEN** user is in ClassDetailPage Học Viên tab for "TOEIC 02"
- **THEN** system displays all students with classId = "TOEIC 02" in table format
- AND columns show: Tên, Khối, SĐT, Học phí/buổi, Thao tác (Edit/Delete)
- AND empty state shown if no students in class

#### Scenario: Edit student from class
- **WHEN** user clicks edit icon on a student in Học Viên list
- **THEN** system opens StudentModal with student data prefilled
- AND all editable fields are available: name, grade, phone, fee
- AND save applies changes globally to the student record

#### Scenario: Delete student from class
- **WHEN** user clicks delete icon on a student in Học Viên list
- **THEN** system shows confirmation: "Bạn có chắc chắn muốn xóa học sinh này không?"
- AND user confirms
- **THEN** student is deleted from database (and no longer appears in any class)

### Requirement: StudentModal behavior in class context
The system SHALL use StudentModal for both creating and editing students, with class context prefilled when creating.

#### Scenario: Modal prefill on create
- **GIVEN** StudentModal opens from ClassDetailPage "Thêm học sinh mới"
- **WHEN** modal renders
- **THEN** classId field is prefilled with the current class ID
- AND user cannot change the class field (read-only or hidden)

#### Scenario: Modal on edit
- **GIVEN** StudentModal opens from ClassDetailPage edit button
- **WHEN** modal renders
- **THEN** all student fields are prefilled
- AND classId field shows the student's current class (read-only)
- AND changes to other fields apply globally when saved

## REMOVED Requirements

### Requirement: Global students table view
**Reason**: Replaced by per-class student management in ClassDetailPage
**Migration**: Access students through ClassDetailPage → Học Viên tab. Global student list removed from StudentsPage.

### Requirement: Students Page with dual tabs
**Reason**: Navigation restructured to class-first; StudentsPage replaced by ClassesOverviewPage and ClassDetailPage
**Migration**: Sidebar "Học Sinh" → "Lớp Học". Click classes from overview, then manage students in class detail view.
