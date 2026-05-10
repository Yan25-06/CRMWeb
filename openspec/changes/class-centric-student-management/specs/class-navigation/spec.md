# Spec: Class Navigation

## ADDED Requirements

### Requirement: Sidebar navigation to classes
The system SHALL change the sidebar navigation item from "Học Sinh" to "Lớp Học" which navigates to the ClassesOverviewPage.

#### Scenario: Click Lớp Học in sidebar
- **WHEN** user clicks "Lớp Học" in the sidebar
- **THEN** system navigates to the ClassesOverviewPage showing all classes

### Requirement: Sidebar item highlights active class
The system SHALL highlight the "Lớp Học" sidebar item when the user is viewing a class detail page.

#### Scenario: Sidebar reflects class view
- **WHEN** user is on ClassDetailPage for a specific class
- **THEN** the "Lớp Học" sidebar item is highlighted or shows active state

### Requirement: Persist selected class
The system SHALL persist the selected class so that returning to "Lớp Học" takes the user back to the last viewed class detail page, not the overview.

#### Scenario: Return to previously viewed class
- **WHEN** user is viewing ClassDetailPage for "TOEIC 02"
- AND navigates away (e.g., clicks Dashboard)
- AND then clicks "Lớp Học" in sidebar
- **THEN** system navigates directly to ClassDetailPage for "TOEIC 02" (not the overview)

#### Scenario: Class selection persists on page reload
- **WHEN** user is viewing ClassDetailPage for "TOEIC 02"
- AND refreshes the browser (F5 or reload)
- **THEN** system displays ClassDetailPage for "TOEIC 02" (class selection survives reload)

### Requirement: Back button returns to overview
The system SHALL provide a back button that returns from ClassDetailPage to ClassesOverviewPage.

#### Scenario: Back button behavior
- **WHEN** user is on ClassDetailPage and clicks the back button (< arrow)
- **THEN** system navigates to ClassesOverviewPage

### Requirement: Sidebar click returns to overview
The system SHALL treat clicking "Lớp Học" while already on ClassDetailPage as a return to overview (or no-op if already on overview).

#### Scenario: Click Lớp Học from class detail
- **WHEN** user is on ClassDetailPage for "TOEIC 02"
- AND clicks "Lớp Học" in sidebar
- **THEN** system navigates back to ClassesOverviewPage

#### Scenario: Click Lớp Học from overview
- **WHEN** user is already on ClassesOverviewPage
- AND clicks "Lớp Học" in sidebar
- **THEN** system remains on ClassesOverviewPage (no navigation occurs)

### Requirement: Classes overview displays all classes
The system SHALL display all available classes in a grid format on ClassesOverviewPage.

#### Scenario: View all classes
- **WHEN** user is on ClassesOverviewPage
- **THEN** system displays all classes in a grid with class cards
- AND each card shows: class name, course type tag, schedule, student count, and edit/delete actions
- AND a button to add a new class is present
