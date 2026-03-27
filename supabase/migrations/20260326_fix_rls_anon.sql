-- ============================================
-- FIX: Allow anonymous users to create profiles and send messages
-- This fixes the issue where new users couldn't send messages
-- ============================================

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- New policies: Allow anonymous users to insert profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create profiles" ON public.profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO public
  USING (true);

-- ============================================
-- CHAT_MESSAGES TABLE
-- ============================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Anyone can read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON public.chat_messages;

-- New policies: Allow anonymous users to send messages
CREATE POLICY "Anyone can read messages" ON public.chat_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can send messages" ON public.chat_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can delete messages" ON public.chat_messages
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- USER_ROLES TABLE (for admin check)
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- New policies: Allow anyone to check roles
CREATE POLICY "Anyone can view user roles" ON public.user_roles
  FOR SELECT
  TO public
  USING (true);

-- ============================================
-- FRIENDSHIPS TABLE
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Addressee can update friendship" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;

-- New policies for anonymous users
CREATE POLICY "Anyone can view friendships" ON public.friendships
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can send friend requests" ON public.friendships
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update friendships" ON public.friendships
  FOR UPDATE
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete friendships" ON public.friendships
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- DIRECT_MESSAGES TABLE
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own DMs" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send DMs to friends" ON public.direct_messages;
DROP POLICY IF EXISTS "Admins can delete DMs" ON public.direct_messages;

-- New policies for anonymous users
CREATE POLICY "Anyone can view DMs" ON public.direct_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can send DMs" ON public.direct_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete DMs" ON public.direct_messages
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Drop old storage policies
DROP POLICY IF EXISTS "Authenticated users can upload DM images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view DM images" ON storage.objects;
DROP POLICY IF EXISTS "Public upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Public read chat images" ON storage.objects;
DROP POLICY IF EXISTS "Public upload dm images" ON storage.objects;
DROP POLICY IF EXISTS "Public read dm images" ON storage.objects;

-- New storage policies for anonymous users
CREATE POLICY "Anyone can upload avatars"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload chat images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id IN ('chat-images', 'dm-images'));

CREATE POLICY "Anyone can read chat images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id IN ('chat-images', 'dm-images'));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Recreate has_role function to work for anon users
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Make sure generate_friend_code still works
CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS TEXT
LANGUAGE PLPGSQL
AS $$
DECLARE
  code TEXT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    code := substring(md5(random()::text) from 1 for 6);
    code := upper(code);

    IF NOT EXISTS (SELECT 1 FROM profiles WHERE friend_code = code) THEN
      RETURN code;
    END IF;

    attempts := attempts + 1;
    IF attempts > 100 THEN
      RETURN NULL;
    END IF;
  END LOOP;
END;
$$;
