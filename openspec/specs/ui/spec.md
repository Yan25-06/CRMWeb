# Spec: UI Design System

## Design Tokens

### Màu Navy/White
```
navy-950: #06142B  — backgrounds tối nhất
navy-900: #0F2044  — sidebar, header
navy-800: #1B3A6B  — primary buttons
navy-700: #234D8A  — hover trên navy-800
navy-600: #2E5FA3  — accents, links
navy-500: #3B72BD  — secondary accents
navy-400: #5A8ECC  — icons inactive
navy-300: #7FAADA  — borders subtle
navy-200: #AACAE8  — borders medium
navy-100: #D4E6F5  — backgrounds teal nhạt
navy-50:  #E8EEF7  — hover state backgrounds
white:    #FFFFFF  — card surfaces, inputs
surface:  #F5F8FC  — page background
```

### Typography
```
font-display: "faustina" — headings, stat values
font-body:    "DM Sans"          — body text, UI labels
font-mono:    "JetBrains Mono"   — code, IDs
```

### Semantic Colors
```
success:     #0D7A55 / bg: #E6F5EF
warning:     #B45309 / bg: #FEF3C7
danger:      #B91C1C / bg: #FEE2E2
```

## Component Specs

### Requirement: Button
- MUST có 3 sizes: sm (px-3 py-1.5), md (px-4 py-2), lg (px-5 py-2.5)
- MUST có variants: primary (navy-800), secondary (navy-50), ghost, danger, success
- MUST có active:scale-[0.97] animation
- MUST disabled state với opacity-50

### Requirement: Card
- MUST dùng border border-navy-100 + shadow-navy-sm
- MUST hover:shadow-navy transition
- MUST border-radius: 2xl (16px)

### Requirement: Input
- MUST có focus ring: ring-2 ring-navy-100 + border-navy-500
- MUST có label dạng uppercase tracking-wide text-xs
- MUST có error state với border-red-400

### Requirement: Modal
- MUST backdrop-blur-sm overlay
- MUST animate-slide-up khi open
- MUST đóng khi click ra ngoài (overlay)
- MUST có header, body, footer sections

### Requirement: Toast
- MUST hiển thị ở bottom-right
- MUST tự đóng sau 3 giây
- MUST 3 loại: success (emerald), error (red), info (navy)
- MUST có icon tương ứng

### Requirement: Navbar
- Desktop: sidebar trái rộng 56 (w-56), background navy-900
- Mobile: top bar + bottom nav 5 items
- Mobile: drawer menu từ trái
- Active state: bg-white/15 text-white
- Inactive state: text-navy-300 hover:text-white

## Layout

### Requirement: App Layout
- Desktop: sidebar cố định bên trái + main content bên phải
- Mobile: top bar sticky + content + bottom nav sticky (pb-24)
- Top bar: chứa month/year picker, sticky z-20
- Content area: p-4 sm:p-6 lg:p-8

### Requirement: Month/Year Picker
- Hiển thị 12 tháng dạng pill buttons trên desktop
- Mobile: chỉ hiện "Tháng X/Y" + prev/next buttons
- Year picker: năm trước / hiện tại / năm sau
- Active month: bg-navy-800 text-white
