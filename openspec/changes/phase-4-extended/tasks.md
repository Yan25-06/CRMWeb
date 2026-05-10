# Tasks: Phase 4 — Nhận Xét, Lịch Dạy

## 1. ReviewsPage
- [ ] 1.1 Tạo `src/pages/ReviewsPage.jsx`
- [ ] 1.2 Sub-tab: "Nhập Nhận Xét" / "Lịch Sử"
- [ ] 1.3 Filter: class select + date input
- [ ] 1.4 Student grid với inputs: speakScore, writeScore, remark, absent checkbox
- [ ] 1.5 Prefill từ db nếu đã có review ngày đó
- [ ] 1.6 Disable inputs khi absent checked
- [ ] 1.7 "Lưu tất cả" → batch upsertReview()
- [ ] 1.8 Tab Lịch Sử: select student → accordion by month → list reviews
- [ ] 1.9 Excel export với SheetJS

## 2. SchedulePage
- [ ] 2.1 Tạo `src/pages/SchedulePage.jsx`
- [ ] 2.2 View mode state: 'day' | 'week' | 'month'
- [ ] 2.3 Current date/week/month state
- [ ] 2.4 Prev/Next/Today navigation
- [ ] 2.5 DayView component
- [ ] 2.6 WeekView component (7-column grid)
- [ ] 2.7 MonthView component (calendar grid)
- [ ] 2.8 Highlight today

## 3. ScheduleModal
- [ ] 3.1 Tạo `src/components/ScheduleModal.jsx`
- [ ] 3.2 Form fields theo spec
- [ ] 3.3 Validation
- [ ] 3.4 Submit → addScheduleItem() / deleteScheduleItem()

## 4. Kết nối App.jsx
- [ ] 4.1 Import ReviewsPage
- [ ] 4.2 Import SchedulePage
- [ ] 4.3 Truyền props đúng
