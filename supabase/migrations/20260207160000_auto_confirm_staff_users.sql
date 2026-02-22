-- Allow admins to auto-confirm staff users created from admin panel.
-- This avoids email verification blocking staff sign-in.

CREATE OR REPLACE FUNCTION public.confirm_staff_user_email(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can confirm staff users';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role = 'staff'
  ) THEN
    RAISE EXCEPTION 'Target user is not a staff user';
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_staff_user_email(UUID) TO authenticated;

-- Backfill: confirm all existing staff users.
UPDATE auth.users u
SET email_confirmed_at = COALESCE(u.email_confirmed_at, now())
FROM public.user_roles r
WHERE r.user_id = u.id
  AND r.role = 'staff';
