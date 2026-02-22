-- Fix message_templates foreign key to allow cascading delete of users
ALTER TABLE public.message_templates
DROP CONSTRAINT IF EXISTS message_templates_created_by_fkey;

ALTER TABLE public.message_templates
ADD CONSTRAINT message_templates_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Fix broadcast_messages foreign key to allow cascading delete of users
ALTER TABLE public.broadcast_messages
DROP CONSTRAINT IF EXISTS broadcast_messages_sender_id_fkey;

ALTER TABLE public.broadcast_messages
ADD CONSTRAINT broadcast_messages_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
