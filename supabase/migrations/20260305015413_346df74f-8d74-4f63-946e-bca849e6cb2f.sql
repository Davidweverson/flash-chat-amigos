
-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL DEFAULT 'geral',
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read messages (no auth required)
CREATE POLICY "Anyone can read messages"
  ON public.chat_messages FOR SELECT TO anon, authenticated
  USING (true);

-- Anyone can insert messages (no auth required)
CREATE POLICY "Anyone can insert messages"
  ON public.chat_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Index for room queries
CREATE INDEX idx_chat_messages_room ON public.chat_messages (room_id, created_at);
