import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  roomId: string;
}

export interface Room {
  id: string;
  name: string;
  emoji: string;
}

export const ROOMS: Room[] = [
  { id: "geral", name: "Sala Geral", emoji: "💬" },
  { id: "games", name: "Games", emoji: "🎮" },
  { id: "musica", name: "Música", emoji: "🎵" },
  { id: "random", name: "Random", emoji: "🎲" },
];

export function useChatStore() {
  const [username, setUsername] = useState<string>("");
  const [currentRoom, setCurrentRoom] = useState<string>("geral");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isJoined, setIsJoined] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRoomRef = useRef(currentRoom);

  // Keep ref in sync
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // Load messages for current room
  const loadMessages = useCallback(async (roomId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(
        data.map((m) => ({
          id: m.id,
          text: m.text,
          sender: m.sender,
          timestamp: new Date(m.created_at),
          roomId: m.room_id,
        }))
      );
    }
  }, []);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!isJoined) return;

    // Load existing messages
    loadMessages(currentRoom);

    // Subscribe to new inserts for current room
    const msgChannel = supabase
      .channel(`messages-${currentRoom}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${currentRoom}`,
        },
        (payload) => {
          const m = payload.new as any;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((msg) => msg.id === m.id)) return prev;
            return [
              ...prev,
              {
                id: m.id,
                text: m.text,
                sender: m.sender,
                timestamp: new Date(m.created_at),
                roomId: m.room_id,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [isJoined, currentRoom, loadMessages]);

  // Presence channel for online users & typing
  useEffect(() => {
    if (!isJoined || !username) return;

    const presenceChannel = supabase.channel("presence-chat", {
      config: { presence: { key: username } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        const typer = payload.payload?.username as string;
        const room = payload.payload?.room as string;
        if (typer && typer !== username && room === currentRoomRef.current) {
          setTypingUsers((prev) =>
            prev.includes(typer) ? prev : [...prev, typer]
          );
          // Auto-clear after 3s
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
  }, [isJoined, username]);

  const joinChat = useCallback((name: string) => {
    setUsername(name);
    setIsJoined(true);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      await supabase.from("chat_messages").insert({
        text,
        sender: username,
        room_id: currentRoom,
      });
    },
    [username, currentRoom]
  );

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
    username,
    currentRoom,
    setCurrentRoom,
    messages: roomMessages,
    typingUsers,
    onlineUsers,
    isJoined,
    joinChat,
    sendMessage,
    sendTyping,
  };
}
