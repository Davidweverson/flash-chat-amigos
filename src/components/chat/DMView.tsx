import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Smile, Plus, Image as ImageIcon } from "lucide-react";
import { useDirectMessages, type DirectMessage } from "@/hooks/useDirectMessages";
import { AttachmentTray } from "./AttachmentTray";
import { ImageLightbox } from "./ImageLightbox";
import { GifPicker } from "./GifPicker";
import { createPendingAttachment, revokePendingAttachments, ACCEPTED_MEDIA_TYPES, isAcceptedFile, isVideoUrl, isGifUrl, type PendingAttachment } from "@/lib/image-utils";
import type { Friend } from "@/hooks/useFriends";

const QUICK_EMOJIS = ["😂", "🔥", "❤️", "👍", "😎", "🎉", "💯", "😭", "🤔", "👀", "✨", "🙌"];

interface DMViewProps {
  userId: string;
  friend: Friend;
  onBack: () => void;
}

function isGiphyUrl(text: string): boolean {
  return /^https?:\/\/.*giphy\.com\/.*\.(gif|webp)/i.test(text.trim()) ||
         /^https?:\/\/media[0-9]*\.giphy\.com\//i.test(text.trim());
}

function DMBubble({ msg, isOwn, onImageClick }: { msg: DirectMessage; isOwn: boolean; onImageClick: (url: string) => void }) {
  const time = msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const hasAttachments = msg.attachments && msg.attachments.length > 0;
  const hasLegacyImage = msg.imageUrl && !hasAttachments;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1`}
    >
      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOwn ? "chat-bubble-own rounded-br-md" : "chat-bubble-other rounded-bl-md"}`}
        >
          {/* New attachment system */}
          {hasAttachments && (
            <div className={`flex flex-col gap-1.5 ${msg.text ? "mb-2" : ""}`}>
              {msg.attachments.map((att, i) => {
                const url = att.url;
                if (isVideoUrl(url)) {
                  return (
                    <div key={i} className="relative max-w-full rounded-lg overflow-hidden cursor-pointer group" style={{ maxWidth: "min(100%, 450px)" }} onClick={() => onImageClick(url)}>
                      <video
                        poster={att.thumbnailUrl && !isVideoUrl(att.thumbnailUrl) ? att.thumbnailUrl : undefined}
                        className="max-w-full rounded-lg"
                        style={{ maxHeight: "350px", objectFit: "contain" }}
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
                          <span className="text-foreground ml-0.5">▶</span>
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
                    onClick={() => onImageClick(att.url)}
                    loading="lazy"
                  />
                );
              })}
            </div>
          )}
          {/* Legacy image support */}
          {hasLegacyImage && (
            <img
              src={msg.imageUrl!}
              alt=""
              className="max-w-full rounded-lg mb-1.5 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxWidth: "min(100%, 450px)", maxHeight: "350px", objectFit: "contain" }}
              onClick={() => onImageClick(msg.imageUrl!)}
              loading="lazy"
            />
          )}
          {msg.text && isGiphyUrl(msg.text) ? (
            <img
              src={msg.text}
              alt="GIF"
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxWidth: "min(100%, 350px)", maxHeight: "300px", objectFit: "contain" }}
              onClick={() => onImageClick(msg.text!)}
              loading="lazy"
            />
          ) : msg.text ? (
            <p>{msg.text}</p>
          ) : null}
          <p className={`text-[10px] mt-1 ${isOwn ? "text-chat-own-foreground/60" : "text-muted-foreground"} text-right`}>
            {time}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function DMView({ userId, friend, onBack }: DMViewProps) {
  const { messages, sendMessage, uploading, uploadProgress } = useDirectMessages(userId, friend.id);
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => revokePendingAttachments(attachments);
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(isAcceptedFile);
    if (imageFiles.length === 0) return;
    setAttachments((prev) => [...prev, ...imageFiles.map(createPendingAttachment)]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    if (!text.trim() && attachments.length === 0) return;
    await sendMessage(text.trim() || undefined, attachments.length > 0 ? attachments : undefined);
    setText("");
    setShowEmojis(false);
    setShowGifs(false);
    setAttachments([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files: File[] = [];
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      const item = e.clipboardData.items[i];
      if (item.type.startsWith("image/") || item.type.startsWith("video/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) addFiles(files);
  };

  const handleGifSelect = (gifUrl: string) => {
    sendMessage(gifUrl);
    setShowGifs(false);
  };

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 h-full ${dragOver ? "ring-2 ring-primary ring-inset" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
      onDrop={handleDrop}
    >
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
          <DMBubble key={msg.id} msg={msg} isOwn={msg.senderId === userId} onImageClick={setLightboxSrc} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="relative">
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full left-0 right-0 mb-2 mx-2 z-20"
          >
            <div className="glass rounded-xl p-3 flex flex-wrap gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { setText((p) => p + emoji); inputRef.current?.focus(); }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <GifPicker
          open={showGifs}
          onClose={() => setShowGifs(false)}
          onSelect={handleGifSelect}
        />

        <AttachmentTray attachments={attachments} onRemove={removeAttachment} uploadProgress={uploadProgress ?? null} />

        <form onSubmit={handleSend} className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MEDIA_TYPES}
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => { setShowGifs(!showGifs); setShowEmojis(false); }}
              className={`p-2.5 rounded-xl transition-colors ${showGifs ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              title="GIFs"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => { setShowEmojis(!showEmojis); setShowGifs(false); }}
              className={`p-2.5 rounded-xl transition-colors ${showEmojis ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Smile className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={handlePaste}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm transition-all"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={(!text.trim() && attachments.length === 0) || uploading}
              className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:brightness-110"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </form>
      </div>

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
