import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  friend_code: string | null;
}

const STORAGE_KEY = "flashchat_profile_id";

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (profileId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();
    if (data) {
      setProfile(data as Profile);
      return true;
    }
    return false;
  }, []);

  const checkAdmin = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    const restore = async () => {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        const found = await fetchProfile(savedId);
        if (found) {
          await checkAdmin(savedId);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setLoading(false);
    };
    restore();
  }, [fetchProfile, checkAdmin]);

  const enter = async (username: string, avatarFile?: File) => {
    // Validate username
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error("Username deve conter apenas letras, números e underscore");
    }
    if (username.length < 3 || username.length > 20) {
      throw new Error("Username deve ter entre 3 e 20 caracteres");
    }

    // Check if username is taken
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      // Username exists - just log in as that user
      setProfile(existing as Profile);
      localStorage.setItem(STORAGE_KEY, existing.id);
      await checkAdmin(existing.id);
      return;
    }

    // Create new profile
    const newId = crypto.randomUUID();
    let avatarUrl: string | null = null;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${newId}/avatar.${ext}`;
      await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = urlData.publicUrl;
    }

    // Generate friend code
    let friendCode: string | null = null;
    try {
      const { data: codeData, error: rpcError } = await supabase.rpc("generate_friend_code");
      if (!rpcError && codeData) {
        friendCode = codeData;
      }
      console.log("Friend code result:", codeData, rpcError);
    } catch (e) {
      console.error("Friend code generation failed:", e);
    }

    const insertPayload = {
      id: newId,
      username,
      avatar_url: avatarUrl,
      friend_code: friendCode,
    };
    console.log("Inserting profile:", insertPayload);

    const { data, error } = await supabase
      .from("profiles")
      .insert(insertPayload)
      .select()
      .single();

    console.log("Insert result:", data, error);
    if (error) throw new Error(`Erro ao criar perfil: ${error.message}`);

    setProfile(data as Profile);
    localStorage.setItem(STORAGE_KEY, newId);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
    setIsAdmin(false);
  };

  return {
    user: profile ? { id: profile.id } : null,
    profile,
    isAdmin,
    loading,
    enter,
    logout,
  };
}
