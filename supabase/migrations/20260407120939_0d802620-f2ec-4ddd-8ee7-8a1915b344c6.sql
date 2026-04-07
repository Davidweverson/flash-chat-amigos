
-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id text PRIMARY KEY,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '',
  is_readonly boolean NOT NULL DEFAULT false,
  allowed_roles text[] NOT NULL DEFAULT '{user,admin}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);

-- Insert existing rooms
INSERT INTO public.rooms (id, name, emoji, is_readonly) VALUES
  ('geral', 'Bate-Papo', '💬', false),
  ('jogos', 'Métodos/Sites', '📁', true),
  ('musica', 'Sobre escola', '🏫', false),
  ('random', 'Caos/Zoeira', '🔥', false),
  ('tecnologia', 'Atualizações', '📢', true)
ON CONFLICT (id) DO UPDATE SET is_readonly = EXCLUDED.is_readonly;

-- Drop old permissive insert policy
DROP POLICY IF EXISTS "Public insert chat_messages" ON public.chat_messages;

-- New insert policy: block non-admin from readonly rooms
CREATE POLICY "Insert chat_messages with readonly check" ON public.chat_messages
FOR INSERT WITH CHECK (
  NOT (SELECT is_readonly FROM public.rooms WHERE rooms.id = room_id)
  OR (SELECT role FROM public.profiles WHERE profiles.id = auth.uid()) = 'admin'
);
