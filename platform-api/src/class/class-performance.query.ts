export const CLASS_PERFORMANCE_QUERY = `
  WITH filtered_students AS (
    SELECT
      enrollment."userId",
      student.name
    FROM
      user_class enrollment
    INNER JOIN
      "user" student
    ON
      student.id = enrollment."userId"
    WHERE
      enrollment."classId" = $1
      AND
        student.role = $2
      AND
        student."deletedAt" IS NULL
      AND
        ($3::text IS NULL OR LOWER(student.name) LIKE LOWER($3))
  ),
  paged_students AS MATERIALIZED (
    SELECT
      "userId",
      name
    FROM
      filtered_students
    ORDER BY
      name ASC,
      "userId" ASC
    OFFSET
      $4
    LIMIT
      $5
  ),
  selected_activities AS (
    SELECT
      "activityId",
      position
    FROM
      unnest($6::int[])
    WITH ORDINALITY AS activity("activityId", position)
  ),
  student_grades AS (
    SELECT
      student."userId",
      student.name,
      activity."activityId",
      activity.position,
      latest.grade
    FROM
      paged_students student
    LEFT JOIN
      selected_activities activity
    ON
      TRUE
    LEFT JOIN LATERAL (
      SELECT CASE WHEN
        attempt.status = $8
      THEN
        0
      ELSE
        attempt.score * 10
      END AS
        grade
      FROM
        attempt
      WHERE
        attempt."userId" = student."userId"
        AND
          attempt."assignmentId" = activity."activityId"
        AND
          attempt.status IN ($7, $8)
      ORDER BY
        attempt."createdAt" DESC,
        attempt.id DESC
      LIMIT 1
    ) latest ON TRUE
  ),
  student_performance AS (
    SELECT
      "userId",
      name,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'activityId', "activityId",
            'grade', grade
          )
          ORDER BY
            position
        ) FILTER (
          WHERE
            "activityId"
          IS NOT NULL
        ),
        '[]'::jsonb
      ) AS grades,
      CASE WHEN
        COUNT("activityId") = 0
      THEN
        NULL
      ELSE
        AVG(COALESCE(grade, 0)) END AS average
    FROM
      student_grades
    GROUP BY
      "userId", name
  )
  SELECT (
    SELECT
      COUNT(*)
    FROM
      filtered_students
    ) AS total,
    COALESCE(
      (
        SELECT
          jsonb_agg(to_jsonb(performance)
        ORDER BY
          performance.name ASC,
          performance."userId" ASC
        )
        FROM
          student_performance performance
      ),
      '[]'::jsonb
    ) AS data
`;
