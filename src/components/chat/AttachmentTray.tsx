import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PendingAttachment } from "@/lib/image-utils";

interface AttachmentTrayProps {
  attachments: PendingAttachment[];
  onRemove: (id: string) => void;
  uploadProgress: number | null;
}

export function AttachmentTray({ attachments, onRemove, uploadProgress }: AttachmentTrayProps) {
  if (attachments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-border bg-secondary/50 px-3 py-2"
    >
      {uploadProgress !== null && (
        <div className="mb-2">
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Enviando... {Math.round(uploadProgress)}%</p>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <AnimatePresence>
          {attachments.map((att) => (
            <motion.div
              key={att.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border group"
            >
              <img
                src={att.preview}
                alt={att.file.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onRemove(att.id)}
                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-background/70 px-1 py-0.5">
                <p className="text-[9px] text-foreground truncate">{att.file.name}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
