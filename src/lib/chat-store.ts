import { useState, useCallback } from "react";

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

const BOT_MESSAGES = [
  "Fala! Tudo certo? 😄",
  "Boa! Partiu conversar",
  "Alguém aí? 👀",
  "Que massa esse chat!",
  "Tô online 🔥",
  "Bora jogar depois?",
  "Quem mais tá acordado? 😂",
];

const BOT_NAMES = ["Lucas", "Ana", "Pedro", "Julia", "Mateus", "Bia"];

export function useChatStore() {
  const [username, setUsername] = useState<string>("");
  const [currentRoom, setCurrentRoom] = useState<string>("geral");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>(["Lucas", "Ana", "Pedro"]);
  const [isJoined, setIsJoined] = useState(false);

  const joinChat = useCallback((name: string) => {
    setUsername(name);
    setIsJoined(true);
    setOnlineUsers((prev) => [...prev, name]);

    // Add welcome message
    const welcomeMsg: Message = {
      id: crypto.randomUUID(),
      text: `${name} entrou no chat! 🎉`,
      sender: "Sistema",
      timestamp: new Date(),
      roomId: "geral",
    };
    setMessages([welcomeMsg]);

    // Simulate some existing messages
    const existing: Message[] = [
      { id: crypto.randomUUID(), text: "E aí galera! 👋", sender: "Lucas", timestamp: new Date(Date.now() - 300000), roomId: "geral" },
      { id: crypto.randomUUID(), text: "Bora conversar!", sender: "Ana", timestamp: new Date(Date.now() - 240000), roomId: "geral" },
      { id: crypto.randomUUID(), text: "Esse chat tá show 🔥", sender: "Pedro", timestamp: new Date(Date.now() - 120000), roomId: "geral" },
      { id: crypto.randomUUID(), text: "Alguém joga Valorant?", sender: "Lucas", timestamp: new Date(Date.now() - 200000), roomId: "games" },
      { id: crypto.randomUUID(), text: "Tô ouvindo muito Kendrick", sender: "Ana", timestamp: new Date(Date.now() - 180000), roomId: "musica" },
    ];
    setMessages((prev) => [...existing, ...prev]);
  }, []);

  const sendMessage = useCallback((text: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      text,
      sender: username,
      timestamp: new Date(),
      roomId: currentRoom,
    };
    setMessages((prev) => [...prev, msg]);

    // Simulate bot response
    const shouldReply = Math.random() > 0.4;
    if (shouldReply) {
      const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      if (botName !== username) {
        setTypingUsers([botName]);
        setTimeout(() => {
          setTypingUsers([]);
          const botMsg: Message = {
            id: crypto.randomUUID(),
            text: BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)],
            sender: botName,
            timestamp: new Date(),
            roomId: currentRoom,
          };
          setMessages((prev) => [...prev, botMsg]);
        }, 1500 + Math.random() * 2000);
      }
    }
  }, [username, currentRoom]);

  const roomMessages = messages.filter((m) => m.roomId === currentRoom);

  return {
    username,
    currentRoom,
    setCurrentRoom,
    messages: roomMessages,
    allMessages: messages,
    typingUsers,
    onlineUsers,
    isJoined,
    joinChat,
    sendMessage,
  };
}
