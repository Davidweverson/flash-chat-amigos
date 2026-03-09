import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Zap, ArrowRight, User, Camera } from "lucide-react";

interface AuthProps {
  onEnter: (username: string, avatar?: File) => Promise<void>;
}

export default function Auth({ onEnter }: AuthProps) {
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Digite um nome de usuário");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username: apenas letras, números e underscore");
      return;
    }

    if (username.length < 3) {
      setError("Username deve ter no mínimo 3 caracteres");
      return;
    }

    setLoading(true);
    try {
      await onEnter(username, avatarFile || undefined);
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass rounded-2xl p-8 md:p-10 w-full max-w-md mx-4 relative z-10">
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 glow-primary">
          
          <MessageCircle className="w-8 h-8 text-primary" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-1 text-foreground text-center">
          Flash<span className="text-primary">Chat BETA     </span>
        </h1>
        <p className="text-muted-foreground mb-6 flex items-center justify-center gap-1.5 text-sm">
          <Zap className="w-4 h-4 text-primary" />
          Escolha seu nome e entre!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full bg-secondary border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center group overflow-hidden">
              
              {avatarPreview ?
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover rounded-full" /> :

              <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              }
              <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Camera className="w-5 h-5 text-foreground" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange} />
            
          </div>
          <p className="text-xs text-muted-foreground text-center -mt-2">Foto opcional</p>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Seu username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" />
            
          </div>

          <AnimatePresence>
            {error &&
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded-lg">
              
                {error}
              </motion.p>
            }
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary transition-all hover:brightness-110 disabled:opacity-50">
            
            {loading ?
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> :

            <>
                Entrar
                <ArrowRight className="w-4 h-4" />
              </>
            }
          </motion.button>
        </form>
      </motion.div>
    </div>);

}