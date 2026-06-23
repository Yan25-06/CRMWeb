-- Lịch học có cấu trúc cho lớp → dùng đồng bộ tự động xuống bảng schedule.
-- schedule_day_list: mảng thứ trong tuần theo quy ước JS (0=CN … 6=T7), VD lớp 3-5-7 → [2,4,6]
ALTER TABLE classes
  ADD COLUMN schedule_day_list jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN start_time text,
  ADD COLUMN end_time text,
  ADD COLUMN room text;
