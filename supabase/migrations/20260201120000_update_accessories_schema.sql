-- Update accessories table with proper schema for different categories
-- Drop existing tables and recreate with new structure

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.accessory_sale_items CASCADE;
DROP TABLE IF EXISTS public.accessory_sales CASCADE;
DROP TABLE IF EXISTS public.accessories CASCADE;

-- Create accessories table with proper schema
CREATE TABLE public.accessories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('uniform', 'exam_booklet', 'belts', 'id_card', 'cultural')),
  item_name TEXT NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  stock_status TEXT NOT NULL CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')) DEFAULT 'in_stock',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create accessory_sales table for sales transactions
CREATE TABLE public.accessory_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  accessory_id UUID REFERENCES public.accessories(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qr_code', 'bank_transfer', 'card')),
  receipt_number TEXT UNIQUE NOT NULL,
  collected_by UUID REFERENCES auth.users(id),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'pending')) DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_accessories_category ON public.accessories(category);
CREATE INDEX idx_accessories_active ON public.accessories(is_active);
CREATE INDEX idx_accessories_stock_status ON public.accessories(stock_status);
CREATE INDEX idx_accessory_sales_student_id ON public.accessory_sales(student_id);
CREATE INDEX idx_accessory_sales_accessory_id ON public.accessory_sales(accessory_id);
CREATE INDEX idx_accessory_sales_academic_year ON public.accessory_sales(academic_year);
CREATE INDEX idx_accessory_sales_payment_status ON public.accessory_sales(payment_status);
CREATE INDEX idx_accessory_sales_created_at ON public.accessory_sales(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessory_sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.accessories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for admin users" ON public.accessories
  FOR ALL USING (public.is_admin());

CREATE POLICY "Enable read access for authenticated users" ON public.accessory_sales
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.accessory_sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.accessory_sales
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at on accessories
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accessories_updated_at
  BEFORE UPDATE ON public.accessories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for each category
INSERT INTO public.accessories (category, item_name, description, unit_price, quantity, stock_status) VALUES
  -- School Uniform
  ('uniform', 'School Shirt', 'White cotton shirt for boys', 350.00, 50, 'in_stock'),
  ('uniform', 'School Trousers', 'Navy blue trousers for boys', 450.00, 45, 'in_stock'),
  ('uniform', 'School Skirt', 'Navy blue skirt for girls', 400.00, 38, 'in_stock'),
  ('uniform', 'School Blazer', 'Navy blue blazer', 800.00, 30, 'in_stock'),
  ('uniform', 'School Tie', 'School tie', 150.00, 100, 'in_stock'),
  
  -- Exam Booklet
  ('exam_booklet', 'Mathematics Exam Booklet', 'Grade 10 Mathematics', 50.00, 150, 'in_stock'),
  ('exam_booklet', 'Science Exam Booklet', 'Grade 9 Science', 60.00, 120, 'in_stock'),
  ('exam_booklet', 'English Exam Booklet', 'Grade 8 English', 45.00, 180, 'in_stock'),
  
  -- Belts
  ('belts', 'Regular Belt', 'Standard school belt', 200.00, 80, 'in_stock'),
  ('belts', 'Elastic Belt', 'Comfort elastic belt', 180.00, 60, 'in_stock'),
  
  -- ID Card
  ('id_card', 'New ID Card', 'Student ID card - new issue', 100.00, 200, 'in_stock'),
  ('id_card', 'Duplicate ID Card', 'Student ID card - replacement', 150.00, 50, 'in_stock'),
  
  -- Cultural Activity
  ('cultural', 'Dance Costume', 'Traditional dance costume', 600.00, 25, 'in_stock'),
  ('cultural', 'Drama Props', 'Theater performance props', 300.00, 40, 'in_stock'),
  ('cultural', 'Traditional Wear', 'Cultural festival attire', 750.00, 20, 'in_stock');
