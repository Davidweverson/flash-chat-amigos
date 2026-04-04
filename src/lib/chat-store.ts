import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playMessageSound } from "@/lib/notification-sounds";
import { uploadAttachment, type AttachmentData, type PendingAttachment } from "@/lib/image-utils";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface MessageAttachment {
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  fileName: string;
  size: number;
}

export interface ReplyInfo {
  id: string;
  sender: string;
  text: string;
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  senderId: string;
  senderAvatar: string | null;
  timestamp: Date;
  roomId: string;
  attachments: MessageAttachment[];
  replyTo: ReplyInfo | null;
}

export interface Room {
  id: string;
  name: string;
  emoji: string;
}

export const ROOMS: Room[] = [
  { id: "geral", name: "​Bate-Papo", emoji: "💬" },
  { id: "jogos", name: "​Métodos/Sites", emoji: "​📁" },
  { id: "musica", name: "​Sobre escola", emoji: "​🏫" },
  { id: "random", name: "​Caos/Zoeira", emoji: "​🔥" },
  { id: "tecnologia", name: "​Atualizações", emoji: "​📢" },
];

const profileCache = new Map<string, { username: string; avatar_url: string | null }>();

async function getProfile(userId: string) {
  if (profileCache.has(userId)) return profileCache.get(userId)!;
  const { data } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", userId)
    .single();
  if (data) {
    profileCache.set(userId, data);
    return data;
  }
  return { username: "Desconhecido", avatar_url: null };
}

async function loadAttachments(messageId: string, messageType: string): Promise<MessageAttachment[]> {
  const { data } = await supabase
    .from("message_attachments")
    .select("*")
    .eq("message_id", messageId)
    .eq("message_type", messageType);
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

async function loadReplyInfo(replyToId: string | null): Promise<ReplyInfo | null> {
  if (!replyToId) return null;
  const { data } = await supabase
    .from("chat_messages")
    .select("id, sender, text")
    .eq("id", replyToId)
    .single();
  if (!data) return null;
  return { id: data.id, sender: data.sender, text: data.text };
}

export function useChatStore(userId: string, username: string) {
  const [currentRoom, setCurrentRoom] = useState<string>("geral");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const channelRef = useRef<RealtimeChannel | null>(null);
  const currentRoomRef = useRef(currentRoom);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
    // Reset unread count when entering a room
    setUnreadCounts((prev) => {
      if (prev[currentRoom]) {
        const next = { ...prev };
        delete next[currentRoom];
        return next;
      }
      return prev;
    });
  }, [currentRoom]);

  const loadMessages = useCallback(async (roomId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      const msgs = await Promise.all(
        data.map(async (m: any) => {
          const profile = m.user_id ? await getProfile(m.user_id) : { username: m.sender, avatar_url: null };
          const attachments = await loadAttachments(m.id, "chat");
          const replyTo = await loadReplyInfo(m.reply_to_id);
          return {
            id: m.id,
            text: m.text,
            sender: profile.username || m.sender,
            senderId: m.user_id || "",
            senderAvatar: profile.avatar_url,
            timestamp: new Date(m.created_at),
            roomId: m.room_id,
            attachments,
            replyTo,
          };
        })
      );
      setMessages(msgs.reverse());
    }
  }, []);

  useEffect(() => {
    loadMessages(currentRoom);

    const msgChannel = supabase
      .channel(`messages-${currentRoom}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${currentRoom}` },
        async (payload) => {
          const m = payload.new as any;
          const profile = m.user_id ? await getProfile(m.user_id) : { username: m.sender, avatar_url: null };
          const isOwnMessage = m.user_id === userId;
          const attachments = await loadAttachments(m.id, "chat");
          const replyTo = await loadReplyInfo(m.reply_to_id);
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === m.id)) return prev;
            return [
              ...prev,
              {
                id: m.id,
                text: m.text,
                sender: profile.username || m.sender,
                senderId: m.user_id || "",
                senderAvatar: profile.avatar_url,
                timestamp: new Date(m.created_at),
                roomId: m.room_id,
                attachments,
                replyTo,
              },
            ];
          });
          if (!isOwnMessage) playMessageSound();
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          const deleted = payload.old as any;
          setMessages((prev) => prev.filter((msg) => msg.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [currentRoom, loadMessages]);

  // Global listener for unread counts on other rooms
  useEffect(() => {
    const unreadChannel = supabase
      .channel("unread-global")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const m = payload.new as any;
          const isOwnMessage = m.user_id === userId;
          if (isOwnMessage) return;
          // Only count if it's not the current room
          if (m.room_id !== currentRoomRef.current) {
            setUnreadCounts((prev) => ({
              ...prev,
              [m.room_id]: (prev[m.room_id] || 0) + 1,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(unreadChannel);
    };
  }, [userId]);

  // Presence channel
  useEffect(() => {
    if (!username) return;

    const presenceChannel = supabase.channel("presence-chat", {
      config: { presence: { key: username } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        const typer = payload.payload?.username as string;
        const room = payload.payload?.room as string;
        if (typer && typer !== username && room === currentRoomRef.current) {
          setTypingUsers((prev) => (prev.includes(typer) ? prev : [...prev, typer]));
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== typer));
          }, 3000);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ username, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = presenceChannel;

    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
      channelRef.current = null;
    };
  }, [username]);

  const sendMessage = useCallback(
    async (text: string, pendingAttachments?: PendingAttachment[], replyToId?: string) => {
      console.log("[ChatStore] Sending message:", { text, userId, username, currentRoom, attachments: pendingAttachments?.length });

      let attachmentData: AttachmentData[] = [];

      if (pendingAttachments && pendingAttachments.length > 0) {
        setUploading(true);
        setUploadProgress(0);
        try {
          const total = pendingAttachments.length;
          attachmentData = [];
          for (let i = 0; i < total; i++) {
            const att = await uploadAttachment(
              pendingAttachments[i].file,
              "chat-images",
              userId,
              (pct) => setUploadProgress(((i / total) + (pct / 100) / total) * 100)
            );
            attachmentData.push(att);
          }
          console.log("[ChatStore] Attachments uploaded:", attachmentData.length);
        } catch (err) {
          console.error("[ChatStore] Upload failed:", err);
          setUploading(false);
          setUploadProgress(null);
          return;
        }
      }

      // Insert the message
      console.log("[ChatStore] Inserting message into DB...");
      const { data: msgData, error: msgError } = await supabase
        .from("chat_messages")
        .insert({
          text: text || "",
          sender: username,
          room_id: currentRoom,
          user_id: userId,
          reply_to_id: replyToId || null,
        } as any)
        .select("id")
        .single();

      if (msgError) {
        console.error("[ChatStore] Failed to insert message:", msgError);
        console.error("[ChatStore] Error details:", JSON.stringify(msgError));
        setUploading(false);
        setUploadProgress(null);
        return;
      }

      console.log("[ChatStore] Message inserted successfully:", msgData.id);

      // Insert attachments
      if (msgData && attachmentData.length > 0) {
        const { error: attError } = await supabase.from("message_attachments").insert(
          attachmentData.map((a) => ({
            message_id: msgData.id,
            message_type: "chat",
            url: a.url,
            thumbnail_url: a.thumbnailUrl,
            width: a.width,
            height: a.height,
            file_name: a.fileName,
            size: a.size,
          }))
        );
        if (attError) {
          console.error("[ChatStore] Failed to insert attachments:", attError);
        } else {
          console.log("[ChatStore] Attachments inserted successfully");
        }
      }

      setUploading(false);
      setUploadProgress(null);
    },
    [username, currentRoom, userId]
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    await supabase.from("chat_messages").delete().eq("id", messageId);
  }, []);

  const sendTyping = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { username, room: currentRoomRef.current },
      });
    }
  }, [username]);

  const roomMessages = messages.filter((m) => m.roomId === currentRoom);

  return {
    currentRoom,
    setCurrentRoom,
    messages: roomMessages,
    typingUsers,
    onlineUsers,
    sendMessage,
    deleteMessage,
    sendTyping,
    uploading,
    uploadProgress,
    unreadCounts,
  };
}
