import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Zap, ArrowRight } from "lucide-react";

interface EntryScreenProps {
  onJoin: (name: string) => void;
}

export function EntryScreen({ onJoin }: EntryScreenProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || `Anon${Math.floor(Math.random() * 9999)}`;
    onJoin(finalName);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass rounded-2xl p-8 md:p-12 w-full max-w-md mx-4 text-center relative"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 glow-primary"
        >
          <MessageCircle className="w-8 h-8 text-primary" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Flash<span className="text-primary">Chat</span>
        </h1>
        <p className="text-muted-foreground mb-8 flex items-center justify-center gap-1.5">
          <Zap className="w-4 h-4 text-primary" />
          Chat instantâneo, sem cadastro
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Seu apelido (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary transition-all hover:brightness-110"
          >
            Entrar no Chat
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        <p className="text-xs text-muted-foreground mt-6">
          Sem conta • Sem senha • Só diversão 🎉
        </p>
      </motion.div>
    </div>
  );
}
