-- Refactor enrollment fee model: replace per-session fee with monthly/course fee
ALTER TABLE public.enrollments
  ADD COLUMN fee_type    text NOT NULL DEFAULT 'monthly'
                         CHECK (fee_type IN ('monthly', 'course')),
  ADD COLUMN monthly_fee integer,
  ADD COLUMN course_fee  integer;

-- Migrate existing data: fee_per_session → monthly_fee
UPDATE public.enrollments
SET monthly_fee = fee_per_session
WHERE fee_per_session IS NOT NULL;

ALTER TABLE public.enrollments DROP COLUMN fee_per_session;

-- Remove unused fee_per_session from fees table
ALTER TABLE public.fees DROP COLUMN IF EXISTS fee_per_session;
