# Spec: Class Detail View

## ADDED Requirements

### Requirement: View selected class details
The system SHALL display a detailed view for a selected class with class metadata at the top (name, schedule, teacher, student count).

#### Scenario: User opens a class
- **WHEN** user clicks on a class from the ClassesOverviewPage
- **THEN** system navigates to ClassDetailPage and displays the selected class header with name, schedule (e.g., "Thứ 3-5-7 · 19:00-20:30"), teacher name, and enrollment count

### Requirement: Display class detail with tabs
The system SHALL display multiple tabs within the class detail view: Học Viên (Students), Điểm Danh (Attendance), Bài Tập (Assignments), Mock Test.

#### Scenario: View available tabs
- **WHEN** user is on ClassDetailPage
- **THEN** system displays 4 tabs at the top: "Học Viên" (active by default), "Điểm Danh", "Bài Tập", "Mock Test"

### Requirement: Display Học Viên tab (students in class)
The system SHALL display a list of students enrolled in the current class with options to add new or existing students.

#### Scenario: View enrolled students
- **WHEN** user is on the Học Viên tab of ClassDetailPage
- **THEN** system displays all students currently enrolled in the class in a table or list format with columns: Tên, Khối, SĐT Phụ huynh, Học phí/buổi, Thao tác (Edit/Delete)

#### Scenario: Add new student to class
- **WHEN** user clicks "Thêm học sinh mới" button in Học Viên tab
- **THEN** system opens StudentModal with class field prefilled with current class
- AND after user submits the modal, student is created AND enrolled in the class
- AND list refreshes to show the new student

#### Scenario: Add existing student to class
- **WHEN** user clicks "Thêm học sinh hiện có" button in Học Viên tab
- **THEN** system shows a selector or list of students NOT currently in the class
- AND user can select and click to enroll them in this class
- AND the enrolled student appears in the Học Viên list

#### Scenario: Edit student in class context
- **WHEN** user clicks edit (pencil icon) on a student in Học Viên tab
- **THEN** system opens StudentModal with student data prefilled
- AND changes made to the student (e.g., name, phone) apply globally (to the student record across all classes)
- AND modal closes after save

#### Scenario: Delete student from class
- **WHEN** user clicks delete (trash icon) on a student in Học Viên tab
- **THEN** system shows a confirmation dialog
- IF user confirms, the student is removed from the class (and potentially deleted from database if confirmation allows)
- IF user cancels, no action is taken

### Requirement: Display placeholder tabs
The system SHALL display "Coming soon" or similar placeholder content in Điểm Danh, Bài Tập, and Mock Test tabs.

#### Scenario: View placeholder tab
- **WHEN** user clicks on "Điểm Danh", "Bài Tập", or "Mock Test" tab
- **THEN** system displays a message indicating the feature is coming soon (e.g., "Tính năng này sẽ sớm có")

### Requirement: Navigate back from class detail
The system SHALL provide a back button that returns the user to the ClassesOverviewPage.

#### Scenario: Back button functionality
- **WHEN** user is on ClassDetailPage and clicks the back button
- **THEN** system navigates back to ClassesOverviewPage
