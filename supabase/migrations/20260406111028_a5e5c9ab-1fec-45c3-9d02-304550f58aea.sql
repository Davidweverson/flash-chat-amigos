
-- Add muted_until to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS muted_until timestamptz DEFAULT NULL;

-- Create reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  message_id uuid DEFAULT NULL,
  message_text text DEFAULT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz DEFAULT NULL
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Admins can view all reports (using profiles.role check)
CREATE POLICY "Admins can view reports"
  ON public.reports FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update reports
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- Enable realtime for reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
