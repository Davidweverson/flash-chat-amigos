import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowLeft, Ban, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Admin() {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!target.trim()) {
      setError("Informe o username ou email do usuário");
      return;
    }

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ban-user", {
        body: { target: target.trim() },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setSuccess(data?.message || "Usuário banido com sucesso");
      setTarget("");
    } catch (err: any) {
      setError(err.message || "Erro ao banir usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 w-full max-w-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <Shield className="w-6 h-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
        </div>

        <div className="p-4 rounded-xl bg-secondary border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            Banir Usuário
          </h2>

          <form onSubmit={handleBan} className="space-y-3">
            <input
              type="text"
              placeholder="Username ou email do usuário"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-destructive text-sm bg-destructive/10 py-2 px-3 rounded-lg"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-400 text-sm bg-green-400/10 py-2 px-3 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  Banir Usuário
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
