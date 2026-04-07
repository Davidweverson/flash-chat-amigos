import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Smile, Plus, Image as ImageIcon, X } from "lucide-react";
import { AttachmentTray } from "./AttachmentTray";
import { GifPicker } from "./GifPicker";
import { createPendingAttachment, revokePendingAttachments, ACCEPTED_MEDIA_TYPES, isAcceptedFile, type PendingAttachment } from "@/lib/image-utils";
import type { ReplyInfo } from "@/lib/chat-store";

interface ChatInputProps {
  onSend: (text: string, attachments?: PendingAttachment[], replyToId?: string) => void;
  onTyping: () => void;
  uploading?: boolean;
  uploadProgress?: number | null;
  replyingTo?: ReplyInfo | null;
  onCancelReply?: () => void;
  sendWithEnter?: boolean;
}

const QUICK_EMOJIS = ["😂", "🔥", "❤️", "👍", "😎", "🎉", "💯", "😭", "🤔", "👀", "✨", "🙌"];

export function ChatInput({ onSend, onTyping, uploading, uploadProgress, replyingTo, onCancelReply }: ChatInputProps) {
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => revokePendingAttachments(attachments);
  }, []);

  // Focus input when replying
  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(isAcceptedFile);
    if (imageFiles.length === 0) return;
    const newAttachments = imageFiles.map(createPendingAttachment);
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    if (!text.trim() && attachments.length === 0) return;
    onSend(text.trim(), attachments.length > 0 ? attachments : undefined, replyingTo?.id);
    setText("");
    setShowEmojis(false);
    setShowGifs(false);
    setAttachments([]);
    onCancelReply?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/") || items[i].type.startsWith("video/")) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) addFiles(files);
  };

  const handleGifSelect = (gifUrl: string) => {
    onSend(gifUrl, undefined, replyingTo?.id);
    setShowGifs(false);
    onCancelReply?.();
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${dragOver ? "ring-2 ring-primary ring-inset" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 bg-primary/10 z-10 flex items-center justify-center pointer-events-none rounded-lg">
          <p className="text-primary font-medium text-sm">Solte as imagens aqui</p>
        </div>
      )}

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
                onClick={() => {
                  setText((p) => p + emoji);
                  inputRef.current?.focus();
                }}
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

      <AttachmentTray
        attachments={attachments}
        onRemove={removeAttachment}
        uploadProgress={uploadProgress ?? null}
      />

      {/* Reply banner */}
      {replyingTo && (
        <div className="px-3 pt-2 pb-0">
          <div className="flex items-center gap-2 bg-secondary/80 rounded-lg px-3 py-2 text-xs">
            <div className="w-1 h-8 bg-primary rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-primary truncate">{replyingTo.sender}</p>
              <p className="text-muted-foreground truncate">{replyingTo.text || "📎 Anexo"}</p>
            </div>
            <button onClick={onCancelReply} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
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
            onChange={handleChange}
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
  );
}
