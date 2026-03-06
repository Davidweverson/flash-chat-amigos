import { ChatLayout } from "@/components/chat/ChatLayout";
import { useChatStore } from "@/lib/chat-store";
import { useAuth } from "@/hooks/useAuth";
import Auth from "./Auth";

const Index = () => {
  const { user, profile, isAdmin, loading, register, login, logout } = useAuth();

  const chat = useChatStore(
    user?.id || "",
    profile?.username || ""
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth onRegister={register} onLogin={login} />;
  }

  return (
    <ChatLayout
      username={profile.username}
      userId={user.id}
      profile={profile}
      isAdmin={isAdmin}
      currentRoom={chat.currentRoom}
      messages={chat.messages}
      typingUsers={chat.typingUsers}
      onlineUsers={chat.onlineUsers}
      onRoomChange={chat.setCurrentRoom}
      onSendMessage={chat.sendMessage}
      onDeleteMessage={chat.deleteMessage}
      onTyping={chat.sendTyping}
      onLogout={logout}
    />
  );
};

export default Index;
