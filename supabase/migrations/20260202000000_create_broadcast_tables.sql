-- Create broadcast_messages table
CREATE TABLE broadcast_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'sms', -- sms, whatsapp, email
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    recipient_count INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, sending, sent, failed
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create broadcast_recipients table
CREATE TABLE broadcast_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    broadcast_id UUID NOT NULL REFERENCES broadcast_messages(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    phone_number VARCHAR(20) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL, -- father, mother
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, sent, delivered, failed
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(broadcast_id, student_id, recipient_type)
);

-- Create message_templates table
CREATE TABLE message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- fee_reminder, holiday, exam, general
    message TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Array of variable names like ["student_name", "amount_due"]
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default message templates
INSERT INTO message_templates (name, category, message, variables, created_by) VALUES
('Fee Reminder', 'fee_reminder', 'Dear {parent_name}, please pay the outstanding fee of ₹{amount_due} for {student_name} by {due_date}. Contact school office for details.', '["parent_name", "amount_due", "student_name", "due_date"]', (SELECT id FROM auth.users LIMIT 1)),
('Holiday Notice', 'holiday', 'Dear Parents, {holiday_message}. School will remain closed on {holiday_date}.', '["holiday_message", "holiday_date"]', (SELECT id FROM auth.users LIMIT 1)),
('Exam Schedule', 'exam', 'Dear Parents, {exam_info} for {student_name} will be held on {exam_date}. Please ensure timely arrival.', '["exam_info", "student_name", "exam_date"]', (SELECT id FROM auth.users LIMIT 1));

-- Create indexes for better performance
CREATE INDEX idx_broadcast_messages_sender_id ON broadcast_messages(sender_id);
CREATE INDEX idx_broadcast_messages_status ON broadcast_messages(status);
CREATE INDEX idx_broadcast_messages_created_at ON broadcast_messages(created_at DESC);
CREATE INDEX idx_broadcast_recipients_broadcast_id ON broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recipients_student_id ON broadcast_recipients(student_id);
CREATE INDEX idx_broadcast_recipients_status ON broadcast_recipients(status);
CREATE INDEX idx_message_templates_category ON message_templates(category);
CREATE INDEX idx_message_templates_is_active ON message_templates(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for broadcast_messages
CREATE POLICY "Users can view broadcast messages they created" ON broadcast_messages
    FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can insert their own broadcast messages" ON broadcast_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own broadcast messages" ON broadcast_messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- RLS Policies for broadcast_recipients
CREATE POLICY "Users can view recipients of their broadcasts" ON broadcast_recipients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM broadcast_messages
            WHERE broadcast_messages.id = broadcast_recipients.broadcast_id
            AND broadcast_messages.sender_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert recipients for their broadcasts" ON broadcast_recipients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM broadcast_messages
            WHERE broadcast_messages.id = broadcast_recipients.broadcast_id
            AND broadcast_messages.sender_id = auth.uid()
        )
    );

CREATE POLICY "Users can update recipients of their broadcasts" ON broadcast_recipients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM broadcast_messages
            WHERE broadcast_messages.id = broadcast_recipients.broadcast_id
            AND broadcast_messages.sender_id = auth.uid()
        )
    );

-- RLS Policies for message_templates
CREATE POLICY "Users can view active message templates" ON message_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can insert their own message templates" ON message_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own message templates" ON message_templates
    FOR UPDATE USING (auth.uid() = created_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_broadcast_messages_updated_at BEFORE UPDATE ON broadcast_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broadcast_recipients_updated_at BEFORE UPDATE ON broadcast_recipients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
