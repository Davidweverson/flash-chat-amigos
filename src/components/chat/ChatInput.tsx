import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Smile } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onTyping: () => void;
}

const QUICK_EMOJIS = ["😂", "🔥", "❤️", "👍", "😎", "🎉", "💯", "😭", "🤔", "👀", "✨", "🙌"];

export function ChatInput({ onSend, onTyping }: ChatInputProps) {
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    setShowEmojis(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping();
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
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
                onClick={() => addEmoji(emoji)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className={`p-2.5 rounded-xl transition-colors ${showEmojis ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <Smile className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm transition-all"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:brightness-110"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}
