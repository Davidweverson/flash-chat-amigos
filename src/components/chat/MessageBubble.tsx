import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { Message } from "@/lib/chat-store";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

export function MessageBubble({ message, isOwn, isAdmin, onDelete }: MessageBubbleProps) {
  const time = message.timestamp.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1 group`}
    >
      {/* Avatar for others */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0 mr-2 mt-5">
          {message.senderAvatar ? (
            <img src={message.senderAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-muted-foreground">{message.sender[0]?.toUpperCase()}</span>
          )}
        </div>
      )}

      <div className={`max-w-[75%] md:max-w-[60%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwn && (
          <span className="text-xs font-medium text-primary ml-1 mb-0.5">{message.sender}</span>
        )}
        <div className="relative">
          <div
            className={`
              px-4 py-2.5 rounded-2xl text-sm leading-relaxed
              ${isOwn
                ? "chat-bubble-own rounded-br-md"
                : "chat-bubble-other rounded-bl-md"
              }
            `}
          >
            <p>{message.text}</p>
            <p className={`text-[10px] mt-1 ${isOwn ? "text-chat-own-foreground/60" : "text-muted-foreground"} text-right`}>
              {time}
            </p>
          </div>

          {/* Admin delete button */}
          {isAdmin && onDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              title="Apagar mensagem"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
