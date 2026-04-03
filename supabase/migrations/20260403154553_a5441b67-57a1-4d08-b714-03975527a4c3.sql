
ALTER TABLE public.chat_messages ADD COLUMN reply_to_id uuid;
ALTER TABLE public.direct_messages ADD COLUMN reply_to_id uuid;
