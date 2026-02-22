-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);


CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) NOT NULL,
  roll_number TEXT,
  father_name TEXT NOT NULL,
  father_phone TEXT NOT NULL,
  mother_name TEXT,
  mother_phone TEXT,
  dob DATE,
  aadhaar TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.fee_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) NOT NULL,
  academic_year TEXT NOT NULL,
  term1_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  term2_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  term3_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  books_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  transport_monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, academic_year)
);

CREATE TABLE public.course_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  academic_year TEXT NOT NULL,
  term INTEGER NOT NULL CHECK (term IN (1, 2, 3)),
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qr_code', 'bank_transfer', 'card')),
  receipt_number TEXT NOT NULL UNIQUE,
  collected_by UUID REFERENCES auth.users(id) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.books_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  academic_year TEXT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qr_code', 'bank_transfer', 'card')),
  receipt_number TEXT NOT NULL UNIQUE,
  collected_by UUID REFERENCES auth.users(id) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


CREATE TABLE public.transport_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  academic_year TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qr_code', 'bank_transfer', 'card')),
  receipt_number TEXT NOT NULL UNIQUE,
  collected_by UUID REFERENCES auth.users(id) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create school settings table
CREATE TABLE public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL DEFAULT 'Oxford School',
  school_address TEXT,
  school_phone TEXT,
  school_email TEXT,
  logo_url TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  upi_id TEXT,
  current_academic_year TEXT NOT NULL DEFAULT '2024-25',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Create helper function to check if user is staff or admin
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
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
      AND role IN ('admin', 'staff')
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- RLS Policies for profiles
CREATE POLICY "Staff and admin can view profiles" ON public.profiles
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- RLS Policies for classes
CREATE POLICY "Authenticated users can view classes" ON public.classes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (public.is_admin());

-- RLS Policies for students
CREATE POLICY "Staff and admin can view students" ON public.students
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff and admin can manage students" ON public.students
  FOR ALL USING (public.is_staff_or_admin());

-- RLS Policies for fee_structure
CREATE POLICY "Staff and admin can view fee structure" ON public.fee_structure
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Admins can manage fee structure" ON public.fee_structure
  FOR ALL USING (public.is_admin());

-- RLS Policies for course_payments
CREATE POLICY "Staff and admin can view course payments" ON public.course_payments
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff and admin can manage course payments" ON public.course_payments
  FOR ALL USING (public.is_staff_or_admin());

-- RLS Policies for books_payments
CREATE POLICY "Staff and admin can view books payments" ON public.books_payments
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff and admin can manage books payments" ON public.books_payments
  FOR ALL USING (public.is_staff_or_admin());

-- RLS Policies for transport_payments
CREATE POLICY "Staff and admin can view transport payments" ON public.transport_payments
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff and admin can manage transport payments" ON public.transport_payments
  FOR ALL USING (public.is_staff_or_admin());

-- RLS Policies for school_settings
CREATE POLICY "Staff and admin can view settings" ON public.school_settings
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Admins can manage settings" ON public.school_settings
  FOR ALL USING (public.is_admin());

-- Insert default classes
INSERT INTO public.classes (name, sort_order) VALUES
  ('Nursery', 1),
  ('LKG', 2),
  ('UKG', 3),
  ('Class 1', 4),
  ('Class 2', 5),
  ('Class 3', 6),
  ('Class 4', 7),
  ('Class 5', 8),
  ('Class 6', 9),
  ('Class 7', 10),
  ('Class 8', 11),
  ('Class 9', 12),
  ('Class 10', 13);

-- Insert default school settings
INSERT INTO public.school_settings (school_name) VALUES ('Oxford School');

-- Create function to generate receipt numbers
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_structure_updated_at
  BEFORE UPDATE ON public.fee_structure
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_school_settings_updated_at
  BEFORE UPDATE ON public.school_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
