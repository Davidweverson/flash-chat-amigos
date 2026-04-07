import { useState, useEffect, useRef } from "react";
import { Menu, Lock, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatSidebar } from "./ChatSidebar";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { AddFriendModal } from "./AddFriendModal";
import { DMView } from "./DMView";
import { ImageLightbox } from "./ImageLightbox";
import { ReportModal } from "./ReportModal";
import { ThemeToggle } from "./ThemeToggle";
import { ChangelogModal, LATEST_VERSION } from "./ChangelogModal";
import { Megaphone } from "lucide-react";
import type { Room, Message, ReplyInfo } from "@/lib/chat-store";
import type { Profile } from "@/hooks/useAuth";
import type { Friend, FriendRequest } from "@/hooks/useFriends";
import type { PendingAttachment } from "@/lib/image-utils";
import { useSettings } from "@/lib/settings-context";

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
  onSendMessage: (text: string, attachments?: PendingAttachment[], replyToId?: string) => void;
  onDeleteMessage: (id: string) => void;
  onTyping: () => void;
  onLogout: () => void;
  uploading?: boolean;
  uploadProgress?: number | null;
  friends: Friend[];
  pendingRequests: FriendRequest[];
  friendLoading: boolean;
  onAddFriend: (code: string) => Promise<string>;
  onAcceptRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
  onRemoveFriend: (friendshipId: string) => void;
  unreadCounts: Record<string, number>;
  onProfileUpdated?: () => void;
  isMuted?: boolean;
  rooms: Room[];
  currentRoomData?: Room;
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
  unreadCounts,
  onProfileUpdated,
  isMuted,
  rooms,
  currentRoomData,
}: ChatLayoutProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [activeDMFriend, setActiveDMFriend] = useState<Friend | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyInfo | null>(null);
  const [reportMessage, setReportMessage] = useState<Message | null>(null);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const room = currentRoomData || rooms.find((r) => r.id === currentRoom);

  const isReadonly = room?.is_readonly && !isAdmin;

  // Check for unread changelog
  const lastReadVersion = typeof window !== "undefined" ? localStorage.getItem("flashchat_changelog_read") : null;
  const hasUnreadChangelog = lastReadVersion !== LATEST_VERSION;

  const handleOpenChangelog = () => {
    setChangelogOpen(true);
    localStorage.setItem("flashchat_changelog_read", LATEST_VERSION);
  };

  const prevMessagesLenRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevMessagesLenRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLenRef.current = messages.length;
  }, [messages]);

  const handleOpenDM = (friend: Friend) => setActiveDMFriend(friend);
  const handleBackToRoom = () => setActiveDMFriend(null);
  const handleRoomChange = (id: string) => {
    setActiveDMFriend(null);
    setReplyingTo(null);
    onRoomChange(id);
  };

  const handleReply = (message: Message) => {
    setReplyingTo({ id: message.id, sender: message.sender, text: message.text });
  };

  const handleSendMessage = (text: string, attachments?: PendingAttachment[], replyToId?: string) => {
    onSendMessage(text, attachments, replyToId);
    setReplyingTo(null);
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
        unreadCounts={unreadCounts}
        onProfileUpdated={onProfileUpdated}
        rooms={rooms}
        onOpenChangelog={handleOpenChangelog}
        hasUnreadChangelog={hasUnreadChangelog}
        onOpenSettings={() => navigate("/settings")}
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
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground text-sm">{room?.name}</h2>
                {room?.is_readonly && (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{onlineUsers.length} online</p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              {isAdmin && (
                <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              )}
            </div>
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
                onDelete={onDeleteMessage}
                onImageClick={setLightboxSrc}
                onReply={isReadonly ? undefined : handleReply}
                onReport={(m) => setReportMessage(m)}
                showAvatar={settings.showAvatars}
                showTimestamp={settings.showTimestamp}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {settings.showTypingIndicator && <TypingIndicator users={typingUsers} />}

          {isMuted ? (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground bg-destructive/10 border-t border-border">
              🔇 Você está mutado e não pode enviar mensagens no momento.
            </div>
          ) : isReadonly ? (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground bg-muted/50 border-t border-border flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Este canal é somente leitura. Apenas administradores podem enviar mensagens.
            </div>
          ) : (
            <ChatInput
              onSend={handleSendMessage}
              onTyping={onTyping}
              uploading={uploading}
              uploadProgress={uploadProgress}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              sendWithEnter={settings.sendWithEnter}
            />
          )}
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

      <ReportModal
        open={!!reportMessage}
        onClose={() => setReportMessage(null)}
        message={reportMessage}
        reporterId={userId}
      />

      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </div>
  );
}
