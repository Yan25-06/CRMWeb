-- Add skill_config to classes: list of { name, maxScore, order } for each skill
ALTER TABLE classes ADD COLUMN skill_config jsonb NOT NULL DEFAULT
  '[{"name":"Listening","maxScore":9,"order":0},
    {"name":"Reading","maxScore":9,"order":1},
    {"name":"Writing","maxScore":9,"order":2},
    {"name":"Speaking","maxScore":9,"order":3}]';

-- Refactor reviews: drop fixed 4 skill columns, add dynamic scores jsonb
ALTER TABLE reviews
  DROP COLUMN IF EXISTS listen_score,
  DROP COLUMN IF EXISTS speak_score,
  DROP COLUMN IF EXISTS read_score,
  DROP COLUMN IF EXISTS write_score;

ALTER TABLE reviews ADD COLUMN scores jsonb NOT NULL DEFAULT '{}';
