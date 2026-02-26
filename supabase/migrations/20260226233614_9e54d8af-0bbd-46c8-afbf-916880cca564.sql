
-- Reminders table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  remind_date DATE NOT NULL,
  remind_time TIME DEFAULT '09:00',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  whatsapp_number TEXT NOT NULL DEFAULT '5561995101789',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage reminders" ON public.reminders FOR ALL USING (is_admin());

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Notes table
CREATE TABLE public.admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  color TEXT DEFAULT 'yellow',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage notes" ON public.admin_notes FOR ALL USING (is_admin());

CREATE TRIGGER update_admin_notes_updated_at BEFORE UPDATE ON public.admin_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
