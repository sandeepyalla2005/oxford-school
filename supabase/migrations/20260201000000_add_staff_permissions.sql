-- Add role-based permissions for staff users
-- Staff can only view and add students, but cannot edit/delete
-- Staff cannot modify any payment records

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Create helper function to check if user is staff
CREATE OR REPLACE FUNCTION public.is_staff_only()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'staff'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Update RLS Policy for students - Staff can only INSERT, not UPDATE or DELETE
DROP POLICY IF EXISTS "Staff and admin can manage students" ON public.students;

CREATE POLICY "Admins can manage all student operations" ON public.students
  FOR ALL USING (public.is_admin());

CREATE POLICY "Staff can only view and insert students" ON public.students
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff can only insert students" ON public.students
  FOR INSERT WITH CHECK (public.is_admin() OR public.is_staff_only());

-- Update RLS Policy for course_payments - Staff can only SELECT and INSERT
DROP POLICY IF EXISTS "Staff and admin can manage course payments" ON public.course_payments;

CREATE POLICY "Admins can manage all course payments" ON public.course_payments
  FOR ALL USING (public.is_admin());

CREATE POLICY "Staff can view course payments" ON public.course_payments
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff can only insert course payments" ON public.course_payments
  FOR INSERT WITH CHECK (public.is_admin() OR public.is_staff_only());

-- Update RLS Policy for books_payments - Staff can only SELECT and INSERT
DROP POLICY IF EXISTS "Staff and admin can manage books payments" ON public.books_payments;

CREATE POLICY "Admins can manage all books payments" ON public.books_payments
  FOR ALL USING (public.is_admin());

CREATE POLICY "Staff can view books payments" ON public.books_payments
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff can only insert books payments" ON public.books_payments
  FOR INSERT WITH CHECK (public.is_admin() OR public.is_staff_only());

-- Update RLS Policy for transport_payments - Staff can only SELECT and INSERT
DROP POLICY IF EXISTS "Staff and admin can manage transport payments" ON public.transport_payments;

CREATE POLICY "Admins can manage all transport payments" ON public.transport_payments
  FOR ALL USING (public.is_admin());

CREATE POLICY "Staff can view transport payments" ON public.transport_payments
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff can only insert transport payments" ON public.transport_payments
  FOR INSERT WITH CHECK (public.is_admin() OR public.is_staff_only());

-- Update RLS Policy for accessory_sales - Staff can only SELECT and INSERT
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.accessory_sales;

CREATE POLICY "Admins can manage all accessory sales" ON public.accessory_sales
  FOR ALL USING (public.is_admin());

CREATE POLICY "Staff can view accessory sales" ON public.accessory_sales
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff can only insert accessory sales" ON public.accessory_sales
  FOR INSERT WITH CHECK (public.is_admin() OR public.is_staff_only());

-- Update RLS Policy for accessory_sale_items - Staff can only SELECT and INSERT
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.accessory_sale_items;

CREATE POLICY "Admins can manage all accessory sale items" ON public.accessory_sale_items
  FOR ALL USING (public.is_admin());

CREATE POLICY "Staff can view accessory sale items" ON public.accessory_sale_items
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff can only insert accessory sale items" ON public.accessory_sale_items
  FOR INSERT WITH CHECK (public.is_admin() OR public.is_staff_only());

-- Update RLS Policy for fee_structure - Staff can only SELECT
DROP POLICY IF EXISTS "Staff and admin can view fee structure" ON public.fee_structure;
DROP POLICY IF EXISTS "Admins can manage fee structure" ON public.fee_structure;

CREATE POLICY "Staff and admin can view fee structure" ON public.fee_structure
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Admins can manage fee structure" ON public.fee_structure
  FOR ALL USING (public.is_admin());

-- Update RLS Policy for user_roles - Staff can only SELECT
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Staff and admin can view roles" ON public.user_roles
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Update RLS Policy for profiles - Staff can only SELECT
DROP POLICY IF EXISTS "Staff and admin can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

CREATE POLICY "Staff and admin can view profiles" ON public.profiles
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
