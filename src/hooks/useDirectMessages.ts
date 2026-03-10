import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playMessageSound } from "@/lib/notification-sounds";

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string | null;
  imageUrl: string | null;
  timestamp: Date;
}

export function useDirectMessages(userId: string, friendId: string | null) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const friendIdRef = useRef(friendId);

  useEffect(() => {
    friendIdRef.current = friendId;
  }, [friendId]);

  const loadMessages = useCallback(async () => {
    if (!userId || !friendId) {
      setMessages([]);
      return;
    }

    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`
      )
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      setMessages(
        data.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          receiverId: m.receiver_id,
          text: m.text,
          imageUrl: m.image_url,
          timestamp: new Date(m.created_at),
        }))
      );
    }
  }, [userId, friendId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription for DMs
  useEffect(() => {
    if (!userId || !friendId) return;

    const channel = supabase
      .channel(`dm-${[userId, friendId].sort().join("-")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const m = payload.new as any;
          const currentFriend = friendIdRef.current;
          // Only add if it's part of the current conversation
          if (
            (m.sender_id === userId && m.receiver_id === currentFriend) ||
            (m.sender_id === currentFriend && m.receiver_id === userId)
          ) {
            const isOwnMessage = m.sender_id === userId;
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === m.id)) return prev;
              return [
                ...prev,
                {
                  id: m.id,
                  senderId: m.sender_id,
                  receiverId: m.receiver_id,
                  text: m.text,
                  imageUrl: m.image_url,
                  timestamp: new Date(m.created_at),
                },
              ];
            });
            if (!isOwnMessage) playMessageSound();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "direct_messages" },
        (payload) => {
          const deleted = payload.old as any;
          setMessages((prev) => prev.filter((msg) => msg.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, friendId]);

  const sendMessage = useCallback(
    async (text?: string, imageFile?: File) => {
      if (!friendId) return;

      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from("dm-images")
          .upload(path, imageFile);
        if (!error) {
          const { data: urlData } = supabase.storage
            .from("dm-images")
            .getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      await supabase.from("direct_messages").insert({
        sender_id: userId,
        receiver_id: friendId,
        text: text || null,
        image_url: imageUrl,
      });
    },
    [userId, friendId]
  );

  return { messages, sendMessage };
}
