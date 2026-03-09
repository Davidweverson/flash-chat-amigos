
-- Drop all existing restrictive policies on all tables

-- chat_messages
DROP POLICY IF EXISTS "Admins can delete messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.chat_messages;

-- direct_messages
DROP POLICY IF EXISTS "Admins can delete DMs" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send DMs to friends" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view own DMs" ON public.direct_messages;

-- friendships
DROP POLICY IF EXISTS "Addressee can update friendship" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;

-- profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create new permissive public policies

-- profiles: public read/insert/update
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);

-- chat_messages: public read/insert/delete
CREATE POLICY "Public read messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Public insert messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete messages" ON public.chat_messages FOR DELETE USING (true);

-- direct_messages: public read/insert/delete
CREATE POLICY "Public read DMs" ON public.direct_messages FOR SELECT USING (true);
CREATE POLICY "Public insert DMs" ON public.direct_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete DMs" ON public.direct_messages FOR DELETE USING (true);

-- friendships: public all
CREATE POLICY "Public read friendships" ON public.friendships FOR SELECT USING (true);
CREATE POLICY "Public insert friendships" ON public.friendships FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update friendships" ON public.friendships FOR UPDATE USING (true);
CREATE POLICY "Public delete friendships" ON public.friendships FOR DELETE USING (true);

-- user_roles: public read
CREATE POLICY "Public read roles" ON public.user_roles FOR SELECT USING (true);

-- Make user_id nullable on chat_messages if not already (for non-auth usage)
ALTER TABLE public.chat_messages ALTER COLUMN user_id DROP NOT NULL;
