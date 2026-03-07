
-- Friendship status enum
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'rejected');

-- Friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can see their own friendships
CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Users can update friendships addressed to them (accept/reject)
CREATE POLICY "Addressee can update friendship" ON public.friendships
  FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id);

-- Users can delete their own friendships (unfriend)
CREATE POLICY "Users can delete own friendships" ON public.friendships
  FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Direct messages table
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (sender_id != receiver_id),
  CHECK (text IS NOT NULL OR image_url IS NOT NULL)
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check friendship
CREATE OR REPLACE FUNCTION public.are_friends(_user1 UUID, _user2 UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND ((requester_id = _user1 AND addressee_id = _user2)
        OR (requester_id = _user2 AND addressee_id = _user1))
  )
$$;

-- DM policies: only friends can message each other
CREATE POLICY "Users can view own DMs" ON public.direct_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send DMs to friends" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.are_friends(sender_id, receiver_id)
  );

-- Admins can delete DMs
CREATE POLICY "Admins can delete DMs" ON public.direct_messages
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- Storage bucket for DM images
INSERT INTO storage.buckets (id, name, public) VALUES ('dm-images', 'dm-images', true);

-- Storage policies for dm-images bucket
CREATE POLICY "Authenticated users can upload DM images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dm-images');

CREATE POLICY "Anyone can view DM images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dm-images');
