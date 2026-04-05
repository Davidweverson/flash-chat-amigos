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
    console.log("[Auth] Starting login process for:", username);

    // Validate username
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error("Username deve conter apenas letras, números e underscore");
    }
    if (username.length < 3 || username.length > 20) {
      throw new Error("Username deve ter entre 3 e 20 caracteres");
    }

    // Check if username is taken
    console.log("[Auth] Checking if username exists...");
    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (existingError) {
      console.error("[Auth] Error checking existing user:", existingError);
    }

    if (existing) {
      console.log("[Auth] User exists, logging in:", existing.id);
      // Username exists - just log in as that user
      setProfile(existing as Profile);
      localStorage.setItem(STORAGE_KEY, existing.id);
      await checkAdmin(existing.id);
      return;
    }

    // Create new profile
    console.log("[Auth] Creating new profile...");
    const newId = crypto.randomUUID();
    let avatarUrl: string | null = null;

    if (avatarFile) {
      console.log("[Auth] Uploading avatar...");
      try {
        const ext = avatarFile.name.split(".").pop();
        const path = `${newId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
        console.log("[Auth] Avatar uploaded:", avatarUrl);
      } catch (e) {
        console.error("[Auth] Avatar upload failed:", e);
        // Continue without avatar
      }
    }

    // Generate friend code
    let friendCode: string | null = null;
    try {
      console.log("[Auth] Generating friend code...");
      const { data: codeData, error: rpcError } = await supabase.rpc("generate_friend_code");
      if (rpcError) {
        console.error("[Auth] Friend code RPC error:", rpcError);
      } else if (codeData) {
        friendCode = codeData;
        console.log("[Auth] Friend code generated:", friendCode);
      }
    } catch (e) {
      console.error("[Auth] Friend code generation failed:", e);
    }

    const insertPayload = {
      id: newId,
      username,
      avatar_url: avatarUrl,
      friend_code: friendCode,
    };
    console.log("[Auth] Inserting profile:", insertPayload);

    const { data, error } = await supabase
      .from("profiles")
      .insert(insertPayload)
      .select()
      .single();

    console.log("[Auth] Insert result:", { data, error });
    if (error) {
      console.error("[Auth] Failed to create profile:", error);
      throw new Error(`Erro ao criar perfil: ${error.message}`);
    }

    setProfile(data as Profile);
    localStorage.setItem(STORAGE_KEY, newId);
    console.log("[Auth] Login successful!");
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
