# Delta Spec: Phase 4 — Nhận Xét & Lịch Dạy

## ADDED Requirements

### Requirement: ReviewsPage
- Filter: select lớp + date picker
- Grid học sinh: tên + input điểm nói (0-10) + input điểm viết (0-10) + textarea nhận xét
- Checkbox "Vắng" per student (disable inputs khi vắng)
- Nút "Lưu tất cả" → upsertReview() cho từng HS
- Tab "Lịch sử": accordion theo từng HS → timeline nhận xét theo ngày
- Nút "Xuất Excel" → SheetJS → file với columns: Ngày, Tên HS, Điểm Nói, Điểm Viết, Nhận Xét

#### Scenario: Nhập nhận xét
- GIVEN đã chọn lớp và ngày
- WHEN điền điểm + nhận xét cho từng HS và bấm Lưu
- THEN upsertReview() cho từng HS
- AND toast "Đã lưu nhận xét!"

#### Scenario: Xuất Excel
- WHEN bấm "Xuất Excel"
- THEN lấy tất cả reviews của tháng hiện tại
- THEN tạo XLSX với SheetJS
- THEN download file `nhanxet_thang[X]-[Y].xlsx`

### Requirement: SchedulePage
- 3 view modes: Ngày | Tuần | Tháng (toggle buttons)
- Default: view Tuần
- Header: prev/next navigation + "Hôm nay" button

#### View Ngày
- Hiện lịch của ngày đang chọn
- List các slots: tên lớp, giờ bắt đầu-kết thúc, phòng
- Nút "+ Thêm lịch"

#### View Tuần
- Grid 7 cột (T2-CN) × slots thời gian
- Highlight cột hôm nay (navy-50 bg)
- Click vào slot trống → mở modal thêm lịch
- Click vào slot có lịch → xem/sửa

#### View Tháng
- Calendar grid 7×6
- Mỗi ô hiện tên lớp nếu có lịch hôm đó
- Highlight ngày hôm nay
- Click ngày → switch sang view Ngày

#### Scenario: Thêm lịch dạy
- WHEN bấm "+ Thêm lịch" hoặc click vào slot trống
- THEN mở ScheduleModal
- Fields: lớp (required), ngày trong tuần, giờ bắt đầu, giờ kết thúc, phòng, ghi chú
- Submit → addScheduleItem() → calendar refresh

### Requirement: ScheduleModal
- Select lớp (required)
- Select ngày trong tuần (T2-CN)
- Time inputs: giờ bắt đầu + giờ kết thúc
- Input phòng + ghi chú
- Validation: lớp + giờ required
