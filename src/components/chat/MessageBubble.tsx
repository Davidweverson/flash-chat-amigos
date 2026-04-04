import { motion } from "framer-motion";
import { Trash2, Play, Reply, Copy, Check } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Message } from "@/lib/chat-store";
import { isVideoUrl, isGifUrl } from "@/lib/image-utils";

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

function linkifyText(text: string): ReactNode[] {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:opacity-80 transition-opacity">{part}</a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function isGiphyUrl(text: string): boolean {
  return /^https?:\/\/.*giphy\.com\/.*\.(gif|webp)/i.test(text.trim()) ||
         /^https?:\/\/media[0-9]*\.giphy\.com\//i.test(text.trim());
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onImageClick?: (url: string) => void;
  onReply?: (message: Message) => void;
}

export function MessageBubble({ message, isOwn, isAdmin, onDelete, onImageClick, onReply }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const time = message.timestamp.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const canDelete = isOwn || isAdmin;

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1 group`}
    >
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
              ${isOwn ? "chat-bubble-own rounded-br-md" : "chat-bubble-other rounded-bl-md"}
            `}
          >
            {/* Reply quote */}
            {message.replyTo && (
              <div className="flex items-stretch gap-0 mb-2 rounded-lg overflow-hidden bg-black/10">
                <div className="w-1 bg-primary flex-shrink-0" />
                <div className="px-2.5 py-1.5 min-w-0">
                  <p className="text-xs font-semibold text-primary truncate">{message.replyTo.sender}</p>
                  <p className="text-xs opacity-70 truncate">{message.replyTo.text || "📎 Anexo"}</p>
                </div>
              </div>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`flex flex-col gap-1.5 ${message.text ? "mb-2" : ""}`}>
                {message.attachments.map((att, i) => {
                  const url = att.url;
                  if (isVideoUrl(url)) {
                    return (
                      <div key={i} className="relative max-w-full rounded-lg overflow-hidden cursor-pointer group" style={{ maxWidth: "min(100%, 450px)" }} onClick={() => onImageClick?.(url)}>
                        <video
                          src={att.thumbnailUrl && !isVideoUrl(att.thumbnailUrl) ? undefined : url}
                          poster={att.thumbnailUrl && !isVideoUrl(att.thumbnailUrl) ? att.thumbnailUrl : undefined}
                          className="max-w-full rounded-lg"
                          style={{ maxHeight: "350px", objectFit: "contain" }}
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
                            <Play className="w-6 h-6 text-foreground ml-0.5" />
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <img
                      key={i}
                      src={att.thumbnailUrl || att.url}
                      alt={att.fileName || ""}
                      className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxWidth: "min(100%, 450px)", maxHeight: "350px", objectFit: "contain" }}
                      onClick={() => onImageClick?.(url)}
                      loading="lazy"
                    />
                  );
                })}
              </div>
            )}
            {message.text && isGiphyUrl(message.text) ? (
              <img
                src={message.text}
                alt="GIF"
                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxWidth: "min(100%, 350px)", maxHeight: "300px", objectFit: "contain" }}
                onClick={() => onImageClick?.(message.text)}
                loading="lazy"
              />
            ) : message.text ? (
              <p>{message.text}</p>
            ) : null}
            <p className={`text-[10px] mt-1 ${isOwn ? "text-chat-own-foreground/60" : "text-muted-foreground"} text-right`}>
              {time}
            </p>
          </div>

          {/* Action buttons */}
          <div className={`absolute ${isOwn ? "-left-16" : "-right-16"} top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all`}>
            {onReply && (
              <button
                onClick={() => onReply(message)}
                className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                title="Responder"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                title="Apagar mensagem"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
