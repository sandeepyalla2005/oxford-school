-- Promote active students to the next class based on sort_order
-- Skips inactive (dropout) students and students in the highest class

CREATE OR REPLACE FUNCTION public.promote_students()
RETURNS TABLE(promoted_count INTEGER, skipped_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  promoted INTEGER := 0;
  skipped INTEGER := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admin can promote students';
  END IF;

  WITH active_students AS (
    SELECT s.id, s.class_id
    FROM public.students s
    JOIN public.classes c ON c.id = s.class_id
    WHERE s.is_active = true
  ),
  class_map AS (
    SELECT c.id AS current_id, c_next.id AS next_id
    FROM public.classes c
    LEFT JOIN public.classes c_next
      ON c_next.sort_order = c.sort_order + 1
  ),
  updated AS (
    UPDATE public.students s
    SET class_id = class_map.next_id
    FROM active_students a
    JOIN class_map ON class_map.current_id = a.class_id
    WHERE s.id = a.id
      AND class_map.next_id IS NOT NULL
    RETURNING s.id
  )
  SELECT COUNT(*) INTO promoted FROM updated;

  SELECT COUNT(*) INTO skipped
  FROM active_students a
  JOIN class_map ON class_map.current_id = a.class_id
  WHERE class_map.next_id IS NULL;

  RETURN QUERY SELECT promoted, skipped;
END;
$$;
