import { motion } from "framer-motion";
import type { Message } from "@/lib/chat-store";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isSystem = message.sender === "Sistema";

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-2"
      >
        <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {message.text}
        </span>
      </motion.div>
    );
  }

  const time = message.timestamp.toLocaleTimeString("pt-BR", {
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
      <div className={`max-w-[75%] md:max-w-[60%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {!isOwn && (
          <span className="text-xs font-medium text-primary ml-3 mb-0.5">{message.sender}</span>
        )}
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
      </div>
    </motion.div>
  );
}
