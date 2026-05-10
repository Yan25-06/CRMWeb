## Why

Currently, student management is tab-based with a global students view. This makes it harder to organize and act on students in the context of their class (attendance, assignments, mock tests are all class-specific). Restructuring around classes as the primary entity will make workflows more intuitive and create a natural entry point for future per-class features.

## What Changes

- **Sidebar**: "Học Sinh" becomes "Lớp Học" and leads to a class-focused navigation hub
- **ClassesOverviewPage**: Displays all classes in a grid; entry point when clicking "Lớp Học" (reuses current Classes tab)
- **ClassDetailPage**: New view for a selected class showing:
  - Class header with metadata (name, time, teacher, student count)
  - Tabs: Học Viên, Điểm Danh, Bài Tập, Mock Test
  - Học Viên tab: lists students in the class + add new/add existing student flows
  - Other tabs: "Coming soon" placeholders
- **Student Management**: Moved into ClassDetailPage → Học Viên tab
  - Create new student + enroll in current class
  - Add existing student to current class
  - Edit/delete students (changes reflected globally)
- **Back Navigation**: Back button + "Lớp Học" sidebar click both return to ClassesOverviewPage
- **Class Persistence**: Last viewed class remains selected when returning to "Lớp Học" (via URL or state)
- **Data Model**: Keep single `classId` per student; structure code for future multi-class refactor

## Capabilities

### New Capabilities
- `class-detail-view`: View and manage students within a specific class, with tabs for student-related features
- `class-navigation`: Sidebar-driven navigation with class selection persistence

### Modified Capabilities
- `student-management`: Refactored from global table view to per-class enrollment and management

## Impact

**Affected Components**: Navbar (sidebar navigation), StudentsPage (refactored into ClassesOverviewPage + ClassDetailPage)

**Code Paths**: 
- Student CRUD flows (creation now scoped to class context)
- Navigation routing (new ClassDetail page/route)
- Component structure (new page components, reusable class/student sub-components)

**Data Access**:
- Student queries now filtered by class context
- Class selection state management (URL param or React state)

**User Workflows**: Students are now discovered and managed through class view, not as a separate global list
