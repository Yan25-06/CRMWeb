## Context

Currently, the StudentsPage component contains two tabs: a global students table and a classes grid. The sidebar navigates to this single page. Student management is disconnected from class context, making it unclear which students belong to which classes during editing.

The change restructures around classes as the primary entity, with students managed in their class context. This requires:
- Replacing the sidebar "Học Sinh" item with "Lớp Học"
- Creating two page-level components: ClassesOverviewPage and ClassDetailPage
- Moving student add/edit flows into the class detail context
- Persisting class selection so returning to "Lớp Học" shows the last viewed class

## Goals / Non-Goals

**Goals:**
- Make classes the primary navigation entry point
- Manage students in class context (Học Viên tab within ClassDetailPage)
- Support adding new students or existing students to a class
- Persist selected class across navigation
- Prepare code structure for future multi-class support (students with multiple `classIds`)
- Placeholder tabs (Điểm Danh, Bài Tập, Mock Test) ready for future features

**Non-Goals:**
- Implement multi-class enrollment (single `classId` per student)
- Implement attendance, assignment, or mock test features
- Change the data model beyond adding class persistence state

## Decisions

### 1. Navigation & Routing
**Decision**: Use URL-based class selection (e.g., `/classes/:classId`) for class persistence and back button behavior.

**Rationale**: URL-based routing makes class selection bookmarkable and persistent across page reloads. It's also simpler than managing state context across the app.

**Alternatives Considered**:
- React Context for class state: Would require context provider higher up in App, adds complexity for state management
- localStorage + state: Works but fragile and less standard than URL params

### 2. Page Component Structure
**Decision**: Create two new page components:
- `ClassesOverviewPage`: Reuses logic from current StudentsPage's "Lớp Học" tab
- `ClassDetailPage`: Reuses logic from current StudentsPage's "Học Sinh" tab, but filtered to selected class

**Rationale**: Separation of concerns. Each page has a clear purpose. Reduces the complexity of having two tabs within a single page.

**Implementation**:
- Extract current "Classes" tab logic into ClassesOverviewPage
- Extract current "Students" tab logic and adapt it for ClassDetailPage (pass selected classId as prop/param)
- Update App.jsx routing to handle `/classes` and `/classes/:classId`
- Update Navbar to route to "Lớp Học" → `/classes`

### 3. Student Management Flows
**Decision**: Both "add new" and "add existing" flows are in ClassDetailPage's Học Viên tab.

**Implementation**:
- **Add New Student**: Open StudentModal, prefill with current classId, then create and save
- **Add Existing Student**: Show a selector of all students not yet in this class, click to enroll
- **Edit Student**: Open StudentModal for editing; changes apply globally
- **Delete/Remove**: Remove from class (and potentially delete if confirmconfirmed)

**Note**: Currently students have a single `classId`. If a student is added to a class, they're "owned" by that class. The code structure should allow future refactor to `classIds: []` without major changes—e.g., filter queries could accept an array even if now it's a single value.

### 4. Class Persistence
**Decision**: Use URL params to store selected class. Navbar's "Lớp Học" button checks the current URL and navigates to `/classes` if already there, or to `/classes/:classId` if a class is selected.

**Rationale**: Keeps persistence external to component state, survives page reloads, and integrates cleanly with back button.

**Implementation**:
```
- If on `/classes` → "Lớp Học" does nothing (already on overview)
- If on `/classes/TOEIC02` → clicking back or "Lớp Học" goes to `/classes`
- Back button triggered by UI button → navigate back in history
- "Lớp Học" sidebar button → navigate to `/classes/:classId` if available, else `/classes`
```

### 5. Placeholder Tabs
**Decision**: Điểm Danh, Bài Tập, Mock Test tabs are inactive with "Coming soon" placeholder content.

**Rationale**: Signals future features without implementing empty states. Easy to replace tabs.content later.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **URL state vs component state confusion**: Developers might accidentally manage class selection in Redux/Context instead of URL | Document routing approach in CLAUDE.md or code comments. Enforce URL-based routing in PR reviews. |
| **Multi-class refactor complexity**: Future work to support `classIds` could be error-prone | Keep student queries/filters generic: `filterByClass(studentId, classId)` instead of `filterByClassId(classId)`. Avoid hardcoding `student.classId` access. |
| **Breaking change to StudentsPage**: Existing code/tests referencing the old page structure will break | Refactor cleanly; no partial migration. Update imports and usage in App.jsx. |
| **Back button UX**: Users might expect back to go to the previous page they were on, not always the overview | Use browser back button (history.back()) in UI button, not router.push(). This aligns with user expectations. |

## Migration Plan

1. **Create new components**:
   - ClassesOverviewPage.jsx (extract from StudentsPage Classes tab)
   - ClassDetailPage.jsx (new, shows students for selected class)

2. **Update routing** in App.jsx:
   - Add routes: `/classes` → ClassesOverviewPage, `/classes/:classId` → ClassDetailPage
   - Remove old StudentsPage route or replace with new pages

3. **Update Navbar**:
   - Change "Học Sinh" item to "Lớp Học"
   - Update onNavigate('students') → onNavigate('classes') or navigate('/classes')
   - Add logic for back button and sidebar persistence

4. **Test navigation flows**:
   - Click class → enters detail view
   - Back button returns to overview
   - Clicking "Lớp Học" sidebar from detail returns to overview
   - Adding student to class works
   - Editing student name is reflected globally

5. **Remove StudentsPage** (if not reused elsewhere)

## Open Questions

- Should students be deletable from a class (soft remove enrollment) or globally (hard delete)? → Current assumption: hard delete, confirm with stakeholders
- Should the "add existing student" flow show ALL students or exclude those already in the class? → Current assumption: exclude already-enrolled students
- Is the back button HTML's `<button onClick={() => history.back()}>` or a custom icon button? → TBD in implementation
