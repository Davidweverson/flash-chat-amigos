import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playFriendRequestSound } from "@/lib/notification-sounds";

export interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
  friendshipId: string;
}

export interface FriendRequest {
  id: string;
  requester: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  created_at: string;
}

export function useFriends(userId: string) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!userId) return;

    // Load accepted friendships
    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (friendships) {
      const friendIds = friendships.map((f: any) =>
        f.requester_id === userId ? f.addressee_id : f.requester_id
      );

      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", friendIds);

        if (profiles) {
          setFriends(
            profiles.map((p: any) => ({
              id: p.id,
              username: p.username,
              avatar_url: p.avatar_url,
              friendshipId: friendships.find(
                (f: any) =>
                  (f.requester_id === p.id || f.addressee_id === p.id) &&
                  (f.requester_id === userId || f.addressee_id === userId)
              )?.id || "",
            }))
          );
        }
      } else {
        setFriends([]);
      }
    }

    // Load pending requests (where I'm the addressee)
    const { data: pending } = await supabase
      .from("friendships")
      .select("*")
      .eq("addressee_id", userId)
      .eq("status", "pending");

    if (pending && pending.length > 0) {
      const requesterIds = pending.map((p: any) => p.requester_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", requesterIds);

      if (profiles) {
        setPendingRequests(
          pending.map((p: any) => {
            const profile = profiles.find((pr: any) => pr.id === p.requester_id);
            return {
              id: p.id,
              requester: {
                id: p.requester_id,
                username: profile?.username || "Desconhecido",
                avatar_url: profile?.avatar_url || null,
              },
              created_at: p.created_at,
            };
          })
        );
      }
    } else {
      setPendingRequests([]);
    }
  }, [userId]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const prevPendingCountRef = useRef(0);

  // Track pending count changes for sound
  useEffect(() => {
    if (pendingRequests.length > prevPendingCountRef.current) {
      playFriendRequestSound();
    }
    prevPendingCountRef.current = pendingRequests.length;
  }, [pendingRequests.length]);

  // Subscribe to realtime friendship changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("friendships-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => {
          loadFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadFriends]);

  const addFriendByCode = useCallback(
    async (code: string) => {
      setLoading(true);
      try {
        // Find user by friend code
        const { data: target } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("friend_code", code.toUpperCase())
          .maybeSingle();

        if (!target) throw new Error("Código de amigo não encontrado");
        if (target.id === userId) throw new Error("Você não pode se adicionar");

        // Check if friendship already exists
        const { data: existing } = await supabase
          .from("friendships")
          .select("id, status")
          .or(
            `and(requester_id.eq.${userId},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${userId})`
          )
          .maybeSingle();

        if (existing) {
          if (existing.status === "accepted") throw new Error("Vocês já são amigos!");
          if (existing.status === "pending") throw new Error("Pedido já enviado!");
          // If rejected, allow re-request by deleting old one
          await supabase.from("friendships").delete().eq("id", existing.id);
        }

        await supabase.from("friendships").insert({
          requester_id: userId,
          addressee_id: target.id,
        });

        return target.username;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const acceptRequest = useCallback(async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
  }, []);

  const rejectRequest = useCallback(async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "rejected" })
      .eq("id", friendshipId);
  }, []);

  const removeFriend = useCallback(async (friendshipId: string) => {
    await supabase.from("friendships").delete().eq("id", friendshipId);
  }, []);

  return {
    friends,
    pendingRequests,
    loading,
    addFriendByCode,
    acceptRequest,
    rejectRequest,
    removeFriend,
  };
}
