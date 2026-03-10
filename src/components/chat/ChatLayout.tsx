import { useState, useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { AddFriendModal } from "./AddFriendModal";
import { DMView } from "./DMView";
import { ImageLightbox } from "./ImageLightbox";
import { ROOMS } from "@/lib/chat-store";
import type { Message } from "@/lib/chat-store";
import type { Profile } from "@/hooks/useAuth";
import type { Friend, FriendRequest } from "@/hooks/useFriends";
import type { PendingAttachment } from "@/lib/image-utils";

interface ChatLayoutProps {
  username: string;
  userId: string;
  profile: Profile | null;
  isAdmin: boolean;
  currentRoom: string;
  messages: Message[];
  typingUsers: string[];
  onlineUsers: string[];
  onRoomChange: (id: string) => void;
  onSendMessage: (text: string, attachments?: PendingAttachment[]) => void;
  onDeleteMessage: (id: string) => void;
  onTyping: () => void;
  onLogout: () => void;
  uploading?: boolean;
  uploadProgress?: number | null;
  // Friends
  friends: Friend[];
  pendingRequests: FriendRequest[];
  friendLoading: boolean;
  onAddFriend: (code: string) => Promise<string>;
  onAcceptRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
  onRemoveFriend: (friendshipId: string) => void;
}

export function ChatLayout({
  username,
  userId,
  profile,
  isAdmin,
  currentRoom,
  messages,
  typingUsers,
  onlineUsers,
  onRoomChange,
  onSendMessage,
  onDeleteMessage,
  onTyping,
  onLogout,
  uploading,
  uploadProgress,
  friends,
  pendingRequests,
  friendLoading,
  onAddFriend,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [activeDMFriend, setActiveDMFriend] = useState<Friend | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const room = ROOMS.find((r) => r.id === currentRoom);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleOpenDM = (friend: Friend) => setActiveDMFriend(friend);
  const handleBackToRoom = () => setActiveDMFriend(null);
  const handleRoomChange = (id: string) => {
    setActiveDMFriend(null);
    onRoomChange(id);
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar
        currentRoom={currentRoom}
        onRoomChange={handleRoomChange}
        onlineUsers={onlineUsers}
        username={username}
        profile={profile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        friends={friends}
        pendingRequests={pendingRequests}
        onAcceptRequest={onAcceptRequest}
        onRejectRequest={onRejectRequest}
        onRemoveFriend={onRemoveFriend}
        onOpenAddFriend={() => setAddFriendOpen(true)}
        onOpenDM={handleOpenDM}
        activeDMFriendId={activeDMFriend?.id || null}
      />

      {activeDMFriend ? (
        <DMView userId={userId} friend={activeDMFriend} onBack={handleBackToRoom} />
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 px-4 border-b border-border glass">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-muted-foreground hover:text-foreground p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-lg">{room?.emoji}</span>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground text-sm">{room?.name}</h2>
              <p className="text-xs text-muted-foreground">{onlineUsers.length} online</p>
            </div>
            {isAdmin && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
                Admin
              </span>
            )}
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Nenhuma mensagem ainda. Seja o primeiro a escrever! ✨
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === userId}
                isAdmin={isAdmin}
                onDelete={isAdmin ? onDeleteMessage : undefined}
                onImageClick={setLightboxSrc}
              />
            ))}
            <TypingIndicator users={typingUsers} />
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            onSend={onSendMessage}
            onTyping={onTyping}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
        </div>
      )}

      <AddFriendModal
        open={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
        myFriendCode={profile?.friend_code || null}
        onAddFriend={onAddFriend}
        loading={friendLoading}
      />

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
