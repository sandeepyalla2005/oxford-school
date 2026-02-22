
-- Migration to allow users to view their own roles
-- This fixes the issue where staff members couldn't see their own role due to RLS

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Also ensure public has access to the get_user_roles function if it exists
GRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO anon, authenticated;
