import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Copy, Check } from "lucide-react";

interface AddFriendModalProps {
  open: boolean;
  onClose: () => void;
  myFriendCode: string | null;
  onAddFriend: (code: string) => Promise<string>;
  loading: boolean;
}

export function AddFriendModal({ open, onClose, myFriendCode, onAddFriend, loading }: AddFriendModalProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!code.trim() || code.trim().length !== 5) {
      setError("Código deve ter 5 caracteres");
      return;
    }
    try {
      const name = await onAddFriend(code.trim());
      setSuccess(`Pedido enviado para ${name}!`);
      setCode("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyCode = () => {
    if (myFriendCode) {
      navigator.clipboard.writeText(myFriendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-2xl p-6 w-full max-w-sm mx-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground font-semibold text-lg">Adicionar Amigo</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* My friend code */}
          <div className="mb-5 p-3 rounded-xl bg-secondary">
            <p className="text-xs text-muted-foreground mb-1.5">Seu código de amigo</p>
            <div className="flex items-center gap-2">
              <span className="text-foreground font-mono font-bold text-xl tracking-widest flex-1">
                {myFriendCode || "-----"}
              </span>
              <button
                onClick={copyCode}
                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Add by code */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Código do amigo</p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
                placeholder="XXXXX"
                maxLength={5}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-mono font-bold text-lg tracking-widest"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded-lg">{error}</p>
            )}
            {success && (
              <p className="text-online text-sm text-center bg-online/10 py-2 rounded-lg">{success}</p>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading || code.length !== 5}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Enviar pedido
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
