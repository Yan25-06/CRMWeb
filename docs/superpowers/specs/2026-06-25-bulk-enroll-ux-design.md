# Design: Bulk Enrollment UX

**Date:** 2026-06-25  
**Status:** Approved

## Problem

1. **ClassDetailPage StudentsTab**: Chỉ ghi danh được 1 học sinh mỗi lần — mỗi lần phải mở modal, chọn học sinh, đặt học phí, lưu, lặp lại. Tốn thời gian khi nhập cả lớp mới.
2. **StudentsDirectoryPage**: Không có cách ghi danh học sinh vào lớp từ trang này (chỉ có nút "Ghi danh" cho 1 học sinh trong detail sidebar, không có bulk).

## Approach: Bulk Modal (Approach A)

Thêm 2 luồng ghi danh hàng loạt độc lập nhưng dùng chung `BulkFeeModal` để đặt học phí.

---

## Component mới: `BulkFeeModal`

Modal đặt học phí chung cho batch ghi danh. Dùng chung ở cả 2 nơi.

**Props:**
```
open: boolean
onClose: () => void
classId: string
className: string
students: Array<{ id, name, phone }>   // danh sách đã chọn
onSaved: () => void
```

**Nội dung:**
- Tiêu đề: "Ghi danh X học sinh vào [Tên lớp]"
- Danh sách học sinh được ghi danh (tên, xổ thu gọn)
- Toggle Theo tháng / Theo khóa
- `CurrencyInput` học phí
- Nút "Ghi danh X học sinh" → gọi `enrollmentService.create()` cho từng học sinh (Promise.all) → toast thành công → `onSaved()`

**Logic:**
- `status` mặc định `'active'`
- `goal`, `note` để trống (chỉnh sau qua StudentDetailPanel)
- Nếu 1 trong số enrollments fail → toast error nhưng vẫn reload (partial success ok)

---

## Thay đổi 1: ClassDetailPage StudentsTab

### Nút "Thêm" trong `StudentSidebar`

Hiện tại: mở `EnrollmentModal` (chọn 1 học sinh hoặc tạo mới).

Sau thay đổi: mở `BulkEnrollPickerModal` mới.

### Component mới: `BulkEnrollPickerModal`

Modal chọn nhiều học sinh để ghi danh vào lớp.

**Props:**
```
open: boolean
onClose: () => void
classId: string
currentEnrollments: Enrollment[]   // để lọc học sinh đã có lớp
onSaved: () => void
isAdmin: boolean
```

**Nội dung:**
- Header: "Thêm học viên vào lớp"
- Ô tìm kiếm (filter theo tên/SĐT)
- Danh sách scroll: tất cả học sinh **chưa có enrollment trong lớp này**
  - Mỗi row: checkbox + avatar + tên + SĐT + badge trạng thái tổng (chưa có lớp / đang học lớp X)
- Chip đếm "Đã chọn X học sinh"
- Fee form (`FeeInputs` component tái dùng từ `EnrollmentModal`)
- Nút "Ghi danh X học sinh" (disabled khi 0 chọn)

**Data:** Gọi `studentService.getAll()` khi modal mở. Filter client-side loại bỏ studentId đã có trong `currentEnrollments`.

**Nút "Tạo học sinh mới" (admin only):** Giữ nguyên ở `StudentSidebar` header — vẫn mở `EnrollmentModal` cũ với `mode="add"` cho flow tạo mới + ghi danh 1 người.

---

## Thay đổi 2: StudentsDirectoryPage

### Cơ chế "Chế độ ghi danh"

Khi `classFilter !== ''` (đã chọn 1 lớp cụ thể):
- Checkbox cột đầu bảng **xuất hiện** (hiện tại chỉ show khi `isAdmin`)
- Thanh vàng `EnrollModeBar` hiện phía trên bảng: "⚡ Đang chọn để ghi danh vào **[Tên lớp]**" + nút "Ghi danh X học sinh" + "Hủy chọn"
- Nút "Xóa X học sinh" (bulk delete) **ẩn** khi đang ở chế độ ghi danh (tránh nhầm lẫn)

**Checkbox logic:**
- Học sinh **đã có enrollment trong lớp được chọn** (bất kỳ status): checkbox `disabled` + row mờ + badge "✓ Đã có lớp"
- Học sinh chưa có: checkbox bình thường, có thể tick

**Khi bấm "Ghi danh X học sinh":**
- Mở `BulkFeeModal` với `classId=classFilter`, `students=selectedStudents`
- Sau `onSaved`: clear `selectedIds`, reload data

**Khi chuyển `classFilter` về `''`:**
- Clear `selectedIds`
- Thoát chế độ ghi danh
- Checkbox ẩn

**Quyền:** Cả admin lẫn giáo viên thường đều có thể ghi danh (giống `EnrollmentModal` hiện tại). Checkbox hiện cho tất cả user khi có lớp được chọn.

---

## Data flow

```
BulkEnrollPickerModal / EnrollModeBar
  → BulkFeeModal
    → enrollmentService.create({ classId, studentId, status:'active', feeType, monthlyFee/courseFee })
      [Promise.all cho từng học sinh]
    → toast.success("Đã ghi danh X học sinh")
    → onSaved() → loadData()
```

---

## Files thay đổi

| File | Thay đổi |
|------|----------|
| `src/components/students/BulkEnrollPickerModal.jsx` | **Tạo mới** — modal chọn nhiều HS cho ClassDetailPage |
| `src/components/students/BulkFeeModal.jsx` | **Tạo mới** — modal đặt học phí chung, dùng ở cả 2 nơi |
| `src/components/students/StudentSidebar.jsx` | Đổi prop `onAddStudent` → mở `BulkEnrollPickerModal`; giữ nút "Tạo mới" riêng cho admin |
| `src/pages/ClassDetailPage/tabs/StudentsTab.jsx` | Import + wire `BulkEnrollPickerModal`; truyền `currentEnrollments` |
| `src/pages/StudentsDirectoryPage.jsx` | Thêm `EnrollModeBar`, logic chế độ ghi danh, wire `BulkFeeModal` |

Không cần migration DB, không cần thay đổi service layer.
