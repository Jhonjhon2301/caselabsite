
-- Art templates table
CREATE TABLE public.art_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  preview_url text NOT NULL,
  pdf_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.art_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active art templates" ON public.art_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manage art templates" ON public.art_templates
  FOR ALL USING (is_admin());

-- Chat conversations table
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  customer_name text,
  customer_email text,
  assigned_seller_id uuid,
  status text NOT NULL DEFAULT 'open',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own conversations" ON public.chat_conversations
  FOR SELECT TO authenticated USING (auth.uid() = customer_id);

CREATE POLICY "Customers create own conversations" ON public.chat_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admin manage all conversations" ON public.chat_conversations
  FOR ALL USING (is_admin());

-- Chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_name text,
  sender_role text NOT NULL DEFAULT 'customer',
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read conversation messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (c.customer_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Authenticated insert messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND (c.customer_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Admin manage all messages" ON public.chat_messages
  FOR ALL USING (is_admin());

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;

-- Create storage bucket for art templates
INSERT INTO storage.buckets (id, name, public) VALUES ('art-templates', 'art-templates', true);

-- Storage RLS for art-templates
CREATE POLICY "Anyone can read art templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'art-templates');

CREATE POLICY "Admin upload art templates" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'art-templates' AND is_admin());

CREATE POLICY "Admin delete art templates" ON storage.objects
  FOR DELETE USING (bucket_id = 'art-templates' AND is_admin());
