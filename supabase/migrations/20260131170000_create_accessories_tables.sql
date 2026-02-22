-- Create accessories table for managing accessory items
CREATE TABLE public.accessories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create accessory_sales table for sales transactions
CREATE TABLE public.accessory_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qr_code', 'bank_transfer', 'card')),
  receipt_number TEXT UNIQUE NOT NULL,
  collected_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create accessory_sale_items table for sale line items
CREATE TABLE public.accessory_sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.accessory_sales(id) ON DELETE CASCADE,
  accessory_id UUID REFERENCES public.accessories(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_accessories_active ON public.accessories(is_active);
CREATE INDEX idx_accessory_sales_student_id ON public.accessory_sales(student_id);
CREATE INDEX idx_accessory_sales_academic_year ON public.accessory_sales(academic_year);
CREATE INDEX idx_accessory_sales_created_at ON public.accessory_sales(created_at);
CREATE INDEX idx_accessory_sale_items_sale_id ON public.accessory_sale_items(sale_id);
CREATE INDEX idx_accessory_sale_items_accessory_id ON public.accessory_sale_items(accessory_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessory_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessory_sale_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.accessories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for admin users" ON public.accessories
  FOR ALL USING (public.is_admin());

CREATE POLICY "Enable read access for authenticated users" ON public.accessory_sales
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.accessory_sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.accessory_sale_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.accessory_sale_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create trigger for updated_at on accessories
CREATE TRIGGER update_accessories_updated_at
  BEFORE UPDATE ON public.accessories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample accessory data
INSERT INTO public.accessories (name, price, stock_quantity) VALUES
  ('School Uniform', 1500.00, 50),
  ('School Belt', 200.00, 100),
  ('ID Card', 50.00, 200),
  ('Exam Pads', 100.00, 150);
