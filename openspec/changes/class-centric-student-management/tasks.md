## 1. Create New Page Components

- [x] 1.1 Create ClassesOverviewPage.jsx (extract logic from current StudentsPage Classes tab)
- [x] 1.2 Create ClassDetailPage.jsx with class header metadata display
- [x] 1.3 Set up routing in App.jsx: `/classes` → ClassesOverviewPage, `/classes/:classId` → ClassDetailPage

## 2. Implement ClassDetailPage - Học Viên Tab

- [x] 2.1 Implement Học Viên tab to display students enrolled in selected class (table with Tên, Khối, SĐT, Học phí/buổi columns)
- [x] 2.2 Implement "Thêm học sinh mới" button that opens StudentModal with current classId prefilled
- [x] 2.3 Implement "Thêm học sinh hiện có" button that shows selector of non-enrolled students
- [x] 2.4 Implement edit student button (pencil icon) that opens StudentModal with student data prefilled
- [x] 2.5 Implement delete student button (trash icon) with confirmation dialog
- [x] 2.6 Handle StudentModal submit to create/enroll or update student data

## 3. Implement ClassDetailPage - Placeholder Tabs

- [x] 3.1 Create Điểm Danh tab with "Coming soon" placeholder
- [x] 3.2 Create Bài Tập tab with "Coming soon" placeholder
- [x] 3.3 Create Mock Test tab with "Coming soon" placeholder

## 4. Implement Navigation & Class Persistence

- [x] 4.1 Update Navbar: change "Học Sinh" item to "Lớp Học"
- [x] 4.2 Implement URL-based class selection (e.g., `/classes/:classId`) to persist selected class
- [x] 4.3 Add back button to ClassDetailPage that navigates back to `/classes`
- [x] 4.4 Make "Lớp Học" sidebar click return to last viewed class (or `/classes` if none selected)
- [x] 4.5 Test class persistence: navigate away and back to "Lớp Học", should see last viewed class

## 5. Update Existing Components

- [x] 5.1 Ensure StudentModal works in class context (classId prefill on create, read-only on edit)
- [x] 5.2 Ensure ClassModal still works in ClassesOverviewPage
- [x] 5.3 Update data queries to filter students by classId in ClassDetailPage

## 6. Cleanup & Testing

- [x] 6.1 Refactor StudentsPage to remove tabs, or remove entirely if no longer used elsewhere
- [x] 6.2 Update imports and exports in pages directory
- [x] 6.3 Test navigation flow: click class → detail view → edit student → changes reflect globally
- [x] 6.4 Test back button behavior: ClassDetailPage back → ClassesOverviewPage
- [x] 6.5 Test sidebar "Lớp Học" click: from detail → overview, from overview → no-op
- [x] 6.6 Test student add flows: new student creates with classId, existing student enrolls in class
- [x] 6.7 Verify class persistence: reload page while on ClassDetailPage, should stay on same class
- [x] 6.8 Test empty state: ClassDetailPage with no students shows empty message
