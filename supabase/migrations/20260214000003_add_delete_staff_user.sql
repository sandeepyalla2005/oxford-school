-- Create a function to delete a staff user from auth.users
-- This is necessary because client-side supabase.auth.admin.deleteUser requires service role
-- which should not be exposed on the client.

CREATE OR REPLACE FUNCTION public.delete_staff_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
SET search_path = public, auth
AS $$
BEGIN
  -- Security check: Only admins can delete staff users
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete staff users';
  END IF;

  -- Ensure we are only deleting staff (not other admins)
  IF EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
      RAISE EXCEPTION 'Cannot delete an admin user through this function';
  END IF;

  -- Handle dependencies (delete their actions first)
  DELETE FROM public.message_templates WHERE created_by = target_user_id;
  DELETE FROM public.broadcast_messages WHERE sender_id = target_user_id;
  DELETE FROM public.course_payments WHERE collected_by = target_user_id;
  DELETE FROM public.books_payments WHERE collected_by = target_user_id;
  DELETE FROM public.transport_payments WHERE collected_by = target_user_id;
  DELETE FROM public.accessory_sales WHERE collected_by = target_user_id;

  -- Delete from auth.users
  -- This will cascade to profiles and user_roles due to FK ON DELETE CASCADE
  DELETE FROM auth.users WHERE id = target_user_id;

END;
$$;

-- Function to bulk delete all staff users
CREATE OR REPLACE FUNCTION public.delete_all_staff_users()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  staff_ids UUID[];
BEGIN
  -- Security check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete all staff users';
  END IF;

  -- Get all staff IDs
  SELECT ARRAY(SELECT user_id FROM public.user_roles WHERE role = 'staff') INTO staff_ids;

  IF array_length(staff_ids, 1) > 0 THEN
    -- Handle dependencies
    DELETE FROM public.message_templates WHERE created_by = ANY(staff_ids);
    DELETE FROM public.broadcast_messages WHERE sender_id = ANY(staff_ids);
    DELETE FROM public.course_payments WHERE collected_by = ANY(staff_ids);
    DELETE FROM public.books_payments WHERE collected_by = ANY(staff_ids);
    DELETE FROM public.transport_payments WHERE collected_by = ANY(staff_ids);
    DELETE FROM public.accessory_sales WHERE collected_by = ANY(staff_ids);

    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = ANY(staff_ids);
  END IF;
END;
$$;

-- Function to delete a user by email (useful for clearing orphaned accounts)
CREATE OR REPLACE FUNCTION public.delete_user_by_email(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_id UUID;
BEGIN
  -- Security check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Find the user ID
  SELECT id INTO target_id FROM auth.users WHERE email = p_email;

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_email;
  END IF;

  -- Ensure we don't delete an admin
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Cannot delete an admin user';
  END IF;

  -- Handle dependencies
  DELETE FROM public.message_templates WHERE created_by = target_id;
  DELETE FROM public.broadcast_messages WHERE sender_id = target_id;
  DELETE FROM public.course_payments WHERE collected_by = target_id;
  DELETE FROM public.books_payments WHERE collected_by = target_id;
  DELETE FROM public.transport_payments WHERE collected_by = target_id;
  DELETE FROM public.accessory_sales WHERE collected_by = target_id;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_staff_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_all_staff_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_by_email(TEXT) TO authenticated;
