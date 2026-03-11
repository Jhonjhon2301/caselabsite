
-- Create has_position function to check if user has a specific position
CREATE OR REPLACE FUNCTION public.has_position(_user_id uuid, _position text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND (role = 'admin' AND (position = _position OR position = 'ceo'))
  )
$$;

-- Allow sellers to read all conversations
CREATE POLICY "Sellers read all conversations" ON public.chat_conversations
  FOR SELECT TO authenticated USING (has_position(auth.uid(), 'vendedor'));

-- Allow sellers to update conversations (assign themselves)
CREATE POLICY "Sellers update conversations" ON public.chat_conversations
  FOR UPDATE TO authenticated USING (has_position(auth.uid(), 'vendedor'));

-- Allow sellers to read messages
CREATE POLICY "Sellers read messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (has_position(auth.uid(), 'vendedor'));

-- Allow sellers to insert messages
CREATE POLICY "Sellers insert messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND has_position(auth.uid(), 'vendedor')
  );
