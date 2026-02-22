ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS designation text,
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS qualification text,
ADD COLUMN IF NOT EXISTS personal_email text,
ADD COLUMN IF NOT EXISTS address text;
