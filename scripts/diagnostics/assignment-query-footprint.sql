-- Operational diagnosis: aggregates only, without student code or personal data.
-- Sizes below are JSON-equivalent repetition estimates, not measured V8 heap.
-- Execute with psql -X -v ON_ERROR_STOP=1 -f this-file.sql.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '15s';

SELECT count(*) AS attempts,
       sum(octet_length(to_jsonb(t)::text)) AS attempt_json_bytes
FROM attempt t;

WITH members AS (
  SELECT "classId", count(*) AS total FROM user_class GROUP BY "classId"
), sizes AS (
  SELECT a.id, count(t.id) AS attempts,
         coalesce(sum(octet_length(to_jsonb(t)::text)), 0) AS attempt_json_bytes,
         greatest(coalesce(m.total, 0), 1) AS members
  FROM assignment a
  LEFT JOIN attempt t ON t."assignmentId" = a.id
  LEFT JOIN members m ON m."classId" = a."classId"
  GROUP BY a.id, m.total
)
SELECT sum(attempts) AS attempts,
       sum(attempts * members) AS repeated_attempt_rows,
       sum(attempt_json_bytes) AS original_attempt_json_bytes,
       sum(attempt_json_bytes * members) AS repeated_attempt_json_bytes
FROM sizes;

WITH page AS (
  SELECT id, "classId" FROM assignment ORDER BY id DESC LIMIT 10
), members AS (
  SELECT "classId", count(*) AS total FROM user_class GROUP BY "classId"
)
SELECT count(t.id) AS page_attempts,
       sum(CASE WHEN t.id IS NULL THEN 0 ELSE greatest(coalesce(m.total, 0), 1) END) AS repeated_attempt_rows,
       sum(octet_length(to_jsonb(t)::text)) AS original_attempt_json_bytes,
       sum(octet_length(to_jsonb(t)::text) * greatest(coalesce(m.total, 0), 1)) AS repeated_attempt_json_bytes
FROM page a
LEFT JOIN attempt t ON t."assignmentId" = a.id
LEFT JOIN members m ON m."classId" = a."classId";

ROLLBACK;
