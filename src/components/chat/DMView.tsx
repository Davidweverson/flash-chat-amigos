import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Smile, ImagePlus } from "lucide-react";
import { useDirectMessages, type DirectMessage } from "@/hooks/useDirectMessages";
import type { Friend } from "@/hooks/useFriends";

const QUICK_EMOJIS = ["😂", "🔥", "❤️", "👍", "😎", "🎉", "💯", "😭", "🤔", "👀", "✨", "🙌"];

interface DMViewProps {
  userId: string;
  friend: Friend;
  onBack: () => void;
}

function DMBubble({ msg, isOwn }: { msg: DirectMessage; isOwn: boolean }) {
  const time = msg.timestamp.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}
    >
      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`
            px-4 py-2.5 rounded-2xl text-sm leading-relaxed
            ${isOwn ? "chat-bubble-own rounded-br-md" : "chat-bubble-other rounded-bl-md"}
          `}
        >
          {msg.imageUrl && (
            <img
              src={msg.imageUrl}
              alt=""
              className="max-w-full rounded-lg mb-1.5 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(msg.imageUrl!, "_blank")}
            />
          )}
          {msg.text && <p>{msg.text}</p>}
          <p className={`text-[10px] mt-1 ${isOwn ? "text-chat-own-foreground/60" : "text-muted-foreground"} text-right`}>
            {time}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function DMView({ userId, friend, onBack }: DMViewProps) {
  const { messages, sendMessage } = useDirectMessages(userId, friend.id);
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !sending) return;
    setSending(true);
    try {
      await sendMessage(text.trim() || undefined);
      setText("");
      setShowEmojis(false);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    try {
      await sendMessage(undefined, file);
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header */}
      <header className="h-14 flex items-center gap-3 px-4 border-b border-border glass">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          {friend.avatar_url ? (
            <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-primary">{friend.username[0]?.toUpperCase()}</span>
          )}
        </div>
        <h2 className="font-semibold text-foreground text-sm">{friend.username}</h2>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Envie a primeira mensagem para {friend.username}! 💬
          </div>
        )}
        {messages.map((msg) => (
          <DMBubble key={msg.id} msg={msg} isOwn={msg.senderId === userId} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative">
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full left-0 right-0 mb-2 mx-2"
          >
            <div className="glass rounded-xl p-3 flex flex-wrap gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { setText((p) => p + emoji); }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSend} className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              className={`p-2.5 rounded-xl transition-colors ${showEmojis ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm transition-all"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={!text.trim() || sending}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:brightness-110"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
