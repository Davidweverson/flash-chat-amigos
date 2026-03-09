import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  friend_code: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setProfile(data as Profile);
    }
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

  useEffect(() => {
    let initialSessionHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          try {
            await fetchProfile(u.id);
            await checkAdmin(u.id);
          } catch (e) {
            console.error("Error loading profile:", e);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        if (!initialSessionHandled) {
          initialSessionHandled = true;
          setLoading(false);
        }
      }
    );

    // Fallback: if onAuthStateChange doesn't fire quickly, resolve loading
    const timeout = setTimeout(() => {
      if (!initialSessionHandled) {
        initialSessionHandled = true;
        setLoading(false);
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile, checkAdmin]);

  const register = async (username: string, password: string, avatarFile?: File) => {
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
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existing) {
      throw new Error("Username já está em uso");
    }

    const email = `${username.toLowerCase()}@flashchat.local`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;

    // Upload avatar if provided
    if (avatarFile && data.user) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${data.user.id}/avatar.${ext}`;
      await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", data.user.id);
    }

    return data;
  };

  const login = async (username: string, password: string) => {
    const email = `${username.toLowerCase()}@flashchat.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error("Username ou senha incorretos");
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  return { user, profile, isAdmin, loading, register, login, logout };
}
