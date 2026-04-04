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

export interface DMReplyInfo {
  id: string;
  senderName: string;
  text: string | null;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string | null;
  imageUrl: string | null;
  timestamp: Date;
  attachments: DMAttachment[];
  replyTo: DMReplyInfo | null;
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

async function loadDMReplyInfo(replyToId: string | null, senderNameMap: Map<string, string>): Promise<DMReplyInfo | null> {
  if (!replyToId) return null;
  const { data } = await supabase
    .from("direct_messages")
    .select("id, sender_id, text")
    .eq("id", replyToId)
    .single();
  if (!data) return null;
  const senderName = senderNameMap.get(data.sender_id) || "...";
  return { id: data.id, senderName, text: data.text };
}

export function useDirectMessages(userId: string, friendId: string | null, friendUsername?: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const friendIdRef = useRef(friendId);

  useEffect(() => {
    friendIdRef.current = friendId;
  }, [friendId]);

  // Build a name map for resolving reply sender names
  const buildNameMap = useCallback((): Map<string, string> => {
    const map = new Map<string, string>();
    map.set(userId, "Você");
    if (friendId && friendUsername) map.set(friendId, friendUsername);
    return map;
  }, [userId, friendId, friendUsername]);

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
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      const nameMap = buildNameMap();
      const msgs = await Promise.all(
        data.map(async (m: any) => {
          const attachments = await loadAttachments(m.id);
          const replyTo = await loadDMReplyInfo(m.reply_to_id, nameMap);
          return {
            id: m.id,
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            text: m.text,
            imageUrl: m.image_url,
            timestamp: new Date(m.created_at),
            attachments,
            replyTo,
          };
        })
      );
      setMessages(msgs);
    }
  }, [userId, friendId, buildNameMap]);

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
            const nameMap = buildNameMap();
            const replyTo = await loadDMReplyInfo(m.reply_to_id, nameMap);
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
                  replyTo,
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
  }, [userId, friendId, buildNameMap]);

  const sendMessage = useCallback(
    async (text?: string, pendingAttachments?: PendingAttachment[], replyToId?: string) => {
      if (!friendId) return;

      let attachmentData: AttachmentData[] = [];
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
          reply_to_id: replyToId || null,
        } as any)
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

  const deleteMessage = useCallback(async (messageId: string) => {
    await supabase.from("direct_messages").delete().eq("id", messageId);
  }, []);

  return { messages, sendMessage, deleteMessage, uploading, uploadProgress };
}
