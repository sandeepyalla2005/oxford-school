
-- Migration to allow users to create their own profiles and initial roles
-- This is necessary for the Sign Up process to work correctly

-- Allow public insertion into profiles during signup
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow public insertion into user_roles during signup (defaults to 'staff')
-- In a production app, you might want to restrict this or use a trigger
CREATE POLICY "Users can assign themselves the staff role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'staff');

-- Update profiles policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own roles to avoid recursion in is_admin/is_staff checks
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
