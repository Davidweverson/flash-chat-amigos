import { EntryScreen } from "@/components/chat/EntryScreen";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { useChatStore } from "@/lib/chat-store";

const Index = () => {
  const chat = useChatStore();

  if (!chat.isJoined) {
    return <EntryScreen onJoin={chat.joinChat} />;
  }

  return (
    <ChatLayout
      username={chat.username}
      currentRoom={chat.currentRoom}
      messages={chat.messages}
      typingUsers={chat.typingUsers}
      onlineUsers={chat.onlineUsers}
      onRoomChange={chat.setCurrentRoom}
      onSendMessage={chat.sendMessage}
      onTyping={chat.sendTyping}
    />
  );
};

export default Index;
