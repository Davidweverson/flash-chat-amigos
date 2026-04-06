import { useState } from "react";
import { motion } from "framer-motion";
import { Users, X, LogOut, UserPlus, MessageSquare, Trash2 } from "lucide-react";
import { ROOMS } from "@/lib/chat-store";
import type { Profile } from "@/hooks/useAuth";
import type { Friend, FriendRequest } from "@/hooks/useFriends";
import { FriendRequests } from "./FriendRequests";
import { ProfileEditModal } from "./ProfileEditModal";

interface ChatSidebarProps {
  currentRoom: string;
  onRoomChange: (id: string) => void;
  onlineUsers: string[];
  username: string;
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  friends: Friend[];
  pendingRequests: FriendRequest[];
  onAcceptRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
  onRemoveFriend: (friendshipId: string) => void;
  onOpenAddFriend: () => void;
  onOpenDM: (friend: Friend) => void;
  activeDMFriendId: string | null;
  unreadCounts: Record<string, number>;
  onProfileUpdated?: () => void;
}

export function ChatSidebar({
  currentRoom,
  onRoomChange,
  onlineUsers,
  username,
  profile,
  open,
  onClose,
  onLogout,
  friends,
  pendingRequests,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onOpenAddFriend,
  onOpenDM,
  activeDMFriendId,
  unreadCounts,
  onProfileUpdated,
}: ChatSidebarProps) {
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  return (
    <>
      {open &&
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />
      }

      <aside
        className={`
          fixed md:relative z-50 md:z-auto
          top-0 left-0 h-full w-64
          bg-sidebar border-r border-sidebar-border
          flex flex-col
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
        
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <h2 className="font-bold text-foreground text-lg">
            Flash<span className="text-primary font-sans">Chat BETA  </span>
          </h2>
          <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Rooms */}
          <div className="p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Salas</p>
            {ROOMS.map((room) => {
              const unread = unreadCounts[room.id] || 0;
              const isActive = currentRoom === room.id && !activeDMFriendId;
              return (
                <motion.button
                  key={room.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {onRoomChange(room.id);onClose();}}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"}
                  `}
                >
                  <span className="text-base">{room.emoji}</span>
                  <span className="flex-1 text-left">{room.name}</span>
                  {unread > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Pending requests */}
          {pendingRequests.length > 0 &&
          <div className="p-3 border-t border-sidebar-border">
              <FriendRequests
              requests={pendingRequests}
              onAccept={onAcceptRequest}
              onReject={onRejectRequest} />
            </div>
          }

          {/* Friends */}
          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Amigos — {friends.length}
              </p>
              <button
                onClick={onOpenAddFriend}
                className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Adicionar amigo">
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </div>
            {friends.length === 0 &&
            <p className="text-xs text-muted-foreground px-2 py-2">
                Nenhum amigo ainda. Use seu código para convidar!
              </p>
            }
            <div className="space-y-0.5">
              {friends.map((friend) =>
              <div key={friend.id} className="group flex items-center gap-2">
                  <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {onOpenDM(friend);onClose();}}
                  className={`
                      flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${activeDMFriendId === friend.id ?
                  "bg-primary/10 text-primary shadow-sm" :
                  "text-sidebar-foreground hover:bg-sidebar-accent"}
                    `
                  }>
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {friend.avatar_url ?
                    <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" /> :
                    <span className="text-[10px] font-bold text-primary">{friend.username[0]?.toUpperCase()}</span>
                    }
                    </div>
                    <span className="truncate">{friend.username}</span>
                  </motion.button>
                  <button
                  onClick={() => onRemoveFriend(friend.friendshipId)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  title="Remover amigo">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Online users */}
          <div className="p-3 border-t border-sidebar-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Online — {onlineUsers.length}
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {onlineUsers.map((user) =>
              <div key={user} className="flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground">
                  <div className="w-2 h-2 rounded-full bg-online" />
                  <span className={user === username ? "font-semibold text-primary" : ""}>
                    {user}{user === username ? " (você)" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User section - clickable avatar */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfileEditOpen(true)}
              className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary transition-all cursor-pointer"
              title="Editar perfil"
            >
              {profile?.avatar_url ?
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> :
              <span className="text-primary font-bold text-sm">{username[0]?.toUpperCase()}</span>
              }
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{username}</p>
              <p className="text-xs text-muted-foreground font-mono">{profile?.friend_code || "-----"}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Profile Edit Modal */}
      {profile && (
        <ProfileEditModal
          open={profileEditOpen}
          onClose={() => setProfileEditOpen(false)}
          profile={profile}
          onSaved={() => onProfileUpdated?.()}
        />
      )}
    </>
  );
}
