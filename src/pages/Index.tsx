import { ChatLayout } from "@/components/chat/ChatLayout";
import { useChatStore } from "@/lib/chat-store";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import Auth from "./Auth";

const Index = () => {
  const { user, profile, isAdmin, loading, enter, logout } = useAuth();

  const chat = useChatStore(
    user?.id || "",
    profile?.username || ""
  );

  const {
    friends,
    pendingRequests,
    loading: friendLoading,
    addFriendByCode,
    acceptRequest,
    rejectRequest,
    removeFriend,
  } = useFriends(user?.id || "");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth onEnter={enter} />;
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
      friends={friends}
      pendingRequests={pendingRequests}
      friendLoading={friendLoading}
      onAddFriend={addFriendByCode}
      onAcceptRequest={acceptRequest}
      onRejectRequest={rejectRequest}
      onRemoveFriend={removeFriend}
    />
  );
};

export default Index;
