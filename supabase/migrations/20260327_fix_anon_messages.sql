-- ============================================
-- FIX: Ensure anonymous users can send messages
-- Applied: 2026-03-27
-- ============================================

-- Drop ALL existing policies on chat_messages to start fresh
DROP POLICY IF EXISTS "Anyone can read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON public.chat_messages;

-- Recreate with explicit public access (works for anon AND authenticated)
CREATE POLICY "Public read chat_messages" ON public.chat_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public insert chat_messages" ON public.chat_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public delete chat_messages" ON public.chat_messages
  FOR DELETE
  TO public
  USING (true);

-- Ensure same for profiles table
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public select profiles" ON public.profiles
  FOR SELECT TO public USING (true);

CREATE POLICY "Public insert profiles" ON public.profiles
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public update profiles" ON public.profiles
  FOR UPDATE TO public USING (true);

-- Ensure message_attachments also allows anon
DROP POLICY IF EXISTS "Public read attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Public insert attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Public delete attachments" ON public.message_attachments;

CREATE POLICY "Public read message_attachments" ON public.message_attachments
  FOR SELECT TO public USING (true);

CREATE POLICY "Public insert message_attachments" ON public.message_attachments
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Public delete message_attachments" ON public.message_attachments
  FOR DELETE TO public USING (true);

-- Storage: Ensure buckets allow anon access
DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read chat images" ON storage.objects;
DROP POLICY IF EXISTS "Public upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Public read chat images" ON storage.objects;
DROP POLICY IF EXISTS "Public upload dm images" ON storage.objects;
DROP POLICY IF EXISTS "Public read dm images" ON storage.objects;

CREATE POLICY "Anon upload avatars" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anon read avatars" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'avatars');

CREATE POLICY "Anon upload chat-images" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Anon read chat-images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'chat-images');

CREATE POLICY "Anon upload dm-images" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'dm-images');

CREATE POLICY "Anon read dm-images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'dm-images');
