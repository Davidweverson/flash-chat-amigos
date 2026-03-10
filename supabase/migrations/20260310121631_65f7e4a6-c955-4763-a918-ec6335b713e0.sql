
-- Create message_attachments table
CREATE TABLE public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('chat', 'dm')),
  url text NOT NULL,
  thumbnail_url text,
  width integer,
  height integer,
  file_name text,
  size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Public policies (matching existing permissive approach)
CREATE POLICY "Public read attachments" ON public.message_attachments FOR SELECT TO public USING (true);
CREATE POLICY "Public insert attachments" ON public.message_attachments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public delete attachments" ON public.message_attachments FOR DELETE TO public USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_attachments;

-- Create chat-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true);

-- Storage policies for chat-images
CREATE POLICY "Public upload chat images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'chat-images');
CREATE POLICY "Public read chat images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'chat-images');

-- Ensure dm-images also has upload policy for anon
CREATE POLICY "Public upload dm images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'dm-images');
CREATE POLICY "Public read dm images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'dm-images');
