import React, { useState } from 'react';
import type { User } from '../types/user.types';
import { UserSelector } from '../components/UserSelector/UserSelector';
import { ChatList } from '../components/ChatList/ChatList';
import { ChatWindow } from '../components/ChatWindow/ChatWindow';
import { useChats } from '../hooks/useChats';
import './ChatPage.css';

interface ChatPageProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
}) => {
  const { chats, loading, createChatWithUser } = useChats(currentUser.id);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  const activeChat = chats.find((c) => c.chatId === activeChatId) || null;

  const handleCreateChat = async (otherUserId: number) => {
    const newChatId = await createChatWithUser(otherUserId);
    setActiveChatId(newChatId);
  };

  return (
    <div className="chat-page-layout">
      {/* Top User Session Switcher (Screen 1 integration) */}
      <UserSelector
        users={allUsers}
        currentUser={currentUser}
        onSelectUser={(user) => {
          onSwitchUser(user);
          setActiveChatId(null); // Reset active chat on identity switch
        }}
      />

      <div className={`chat-page-main ${activeChatId ? 'has-active-chat' : ''}`}>
        {/* Left: Chat List & New Chat Creation (Screen 2 & Screen 4) */}
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          currentUser={currentUser}
          allUsers={allUsers}
          onSelectChat={(id) => setActiveChatId(id)}
          onCreateChat={handleCreateChat}
          loading={loading}
        />

        {/* Right: Active Chat Window (Screen 3) */}
        <ChatWindow chat={activeChat} currentUser={currentUser} />
      </div>
    </div>
  );
};
