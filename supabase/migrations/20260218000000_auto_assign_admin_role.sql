-- Auto-assign admin role to specific email addresses on profile creation
-- This ensures administrators always have the correct role

-- Create a trigger function to auto-assign admin role
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the email contains 'sandeep' or 'admin'
  IF NEW.email ILIKE '%sandeep%' OR NEW.email ILIKE '%admin%' THEN
    -- Insert admin role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Insert staff role for others if no role exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'staff')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS auto_assign_role_trigger ON public.profiles;
CREATE TRIGGER auto_assign_role_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();

-- Also create a function to manually fix existing users
CREATE OR REPLACE FUNCTION public.fix_user_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign admin role to admin emails
  INSERT INTO public.user_roles (user_id, role)
  SELECT user_id, 'admin'::app_role
  FROM public.profiles
  WHERE email ILIKE '%sandeep%' OR email ILIKE '%admin%'
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Assign staff role to others who don't have any role
  INSERT INTO public.user_roles (user_id, role)
  SELECT p.user_id, 'staff'::app_role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE ur.user_id IS NULL
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Run the fix for existing users
SELECT public.fix_user_roles();
