import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/lib/chat-store";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  message: Message | null;
  reporterId: string;
}

const REASONS = [
  "Spam",
  "Conteúdo ofensivo",
  "Assédio",
  "Conteúdo impróprio",
  "Outro",
];

export function ReportModal({ open, onClose, message, reporterId }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!message || !reason) return;
    setLoading(true);
    const finalReason = reason === "Outro" ? customReason || "Outro" : reason;
    await supabase.from("reports").insert({
      reporter_id: reporterId,
      reported_user_id: message.senderId,
      message_id: message.id,
      message_text: message.text?.slice(0, 500) || null,
      reason: finalReason,
    } as any);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setReason("");
      setCustomReason("");
      onClose();
    }, 1500);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl p-6 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Flag className="w-5 h-5 text-orange-500" />
              Denunciar Mensagem
            </h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {message && (
            <div className="p-3 rounded-lg bg-secondary mb-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground text-xs mb-1">{message.sender}</p>
              <p className="truncate">{message.text?.slice(0, 100) || "📎 Anexo"}</p>
            </div>
          )}

          {success ? (
            <p className="text-center text-primary font-medium py-4">✅ Denúncia enviada com sucesso!</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all border ${
                      reason === r
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {reason === "Outro" && (
                <input
                  type="text"
                  placeholder="Descreva o motivo..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              )}

              <button
                onClick={handleSubmit}
                disabled={!reason || loading}
                className="w-full py-3 rounded-xl bg-orange-600 text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar Denúncia"}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
