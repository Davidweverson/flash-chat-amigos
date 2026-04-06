import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/hooks/useAuth";

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  onSaved: () => void;
}

export function ProfileEditModal({ open, onClose, profile, onSaved }: ProfileEditModalProps) {
  const [username, setUsername] = useState(profile.username);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem muito grande (máx. 5MB)");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSave = async () => {
    setError("");
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 20) {
      setError("Username deve ter entre 3 e 20 caracteres");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError("Username deve conter apenas letras, números e _");
      return;
    }

    setLoading(true);
    try {
      // Check if username is taken (if changed)
      if (trimmed !== profile.username) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", trimmed)
          .neq("id", profile.id)
          .maybeSingle();
        if (existing) {
          setError("Este username já está em uso");
          setLoading(false);
          return;
        }
      }

      let avatarUrl = profile.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${profile.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl + "?t=" + Date.now();
      }

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ username: trimmed, avatar_url: avatarUrl })
        .eq("id", profile.id);

      if (updateErr) throw updateErr;

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
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
          className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Editar Perfil</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => fileRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden group border-2 border-border hover:border-primary transition-colors"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">{profile.username[0]?.toUpperCase()}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Username */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={20}
            />
          </div>

          {error && (
            <p className="text-destructive text-sm bg-destructive/10 py-2 px-3 rounded-lg mb-4">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
