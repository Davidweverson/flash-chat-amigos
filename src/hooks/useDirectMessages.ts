import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playMessageSound } from "@/lib/notification-sounds";
import { uploadAttachment, type AttachmentData, type PendingAttachment } from "@/lib/image-utils";

export interface DMAttachment {
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  fileName: string;
  size: number;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string | null;
  imageUrl: string | null;
  timestamp: Date;
  attachments: DMAttachment[];
}

async function loadAttachments(messageId: string): Promise<DMAttachment[]> {
  const { data } = await supabase
    .from("message_attachments")
    .select("*")
    .eq("message_id", messageId)
    .eq("message_type", "dm");
  if (!data) return [];
  return data.map((a: any) => ({
    url: a.url,
    thumbnailUrl: a.thumbnail_url || a.url,
    width: a.width || 0,
    height: a.height || 0,
    fileName: a.file_name || "",
    size: a.size || 0,
  }));
}

export function useDirectMessages(userId: string, friendId: string | null) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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
      const msgs = await Promise.all(
        data.map(async (m: any) => {
          const attachments = await loadAttachments(m.id);
          return {
            id: m.id,
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            text: m.text,
            imageUrl: m.image_url,
            timestamp: new Date(m.created_at),
            attachments,
          };
        })
      );
      setMessages(msgs);
    }
  }, [userId, friendId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!userId || !friendId) return;

    const channel = supabase
      .channel(`dm-${[userId, friendId].sort().join("-")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        async (payload) => {
          const m = payload.new as any;
          const currentFriend = friendIdRef.current;
          if (
            (m.sender_id === userId && m.receiver_id === currentFriend) ||
            (m.sender_id === currentFriend && m.receiver_id === userId)
          ) {
            const isOwnMessage = m.sender_id === userId;
            const attachments = await loadAttachments(m.id);
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
                  attachments,
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
    async (text?: string, pendingAttachments?: PendingAttachment[]) => {
      if (!friendId) return;

      let attachmentData: AttachmentData[] = [];
      // Legacy single image support
      let imageUrl: string | null = null;

      if (pendingAttachments && pendingAttachments.length > 0) {
        setUploading(true);
        setUploadProgress(0);
        try {
          const total = pendingAttachments.length;
          for (let i = 0; i < total; i++) {
            const att = await uploadAttachment(
              pendingAttachments[i].file,
              "dm-images",
              userId,
              (pct) => setUploadProgress(((i / total) + (pct / 100) / total) * 100)
            );
            attachmentData.push(att);
          }
        } catch (err) {
          console.error("Upload failed:", err);
          setUploading(false);
          setUploadProgress(null);
          return;
        }
      }

      const { data: msgData } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: userId,
          receiver_id: friendId,
          text: text || null,
          image_url: imageUrl,
        })
        .select("id")
        .single();

      if (msgData && attachmentData.length > 0) {
        await supabase.from("message_attachments").insert(
          attachmentData.map((a) => ({
            message_id: msgData.id,
            message_type: "dm",
            url: a.url,
            thumbnail_url: a.thumbnailUrl,
            width: a.width,
            height: a.height,
            file_name: a.fileName,
            size: a.size,
          }))
        );
      }

      setUploading(false);
      setUploadProgress(null);
    },
    [userId, friendId]
  );

  return { messages, sendMessage, uploading, uploadProgress };
}
