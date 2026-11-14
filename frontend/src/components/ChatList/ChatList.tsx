import React, { useState } from 'react';
import type { Chat } from '../../types/chat.types';
import type { User } from '../../types/user.types';
import './ChatList.css';

interface ChatListProps {
  chats: Chat[];
  activeChatId: number | null;
  currentUser: User | null;
  allUsers: User[];
  onSelectChat: (chatId: number) => void;
  onCreateChat: (otherUserId: number) => Promise<void>;
  loading: boolean;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChatId,
  currentUser,
  allUsers,
  onSelectChat,
  onCreateChat,
  loading,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Available users to start new chat with (exclude currentUser)
  const availableUsers = allUsers.filter((u) => u.id !== currentUser?.id);

  const handleStartChat = async (targetUserId: number) => {
    try {
      setCreating(true);
      await onCreateChat(targetUserId);
      setIsModalOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="chat-list-sidebar">
      <div className="chat-list-header">
        <h2 className="chat-list-title">Conversations</h2>
        <button
          className="btn-new-chat"
          onClick={() => setIsModalOpen(true)}
          title="Start a new 1:1 conversation"
        >
          <span>+</span> New Chat
        </button>
      </div>

      <div className="chat-items-scroll">
        {loading && chats.length === 0 ? (
          <div className="empty-chat-list">Loading chats...</div>
        ) : chats.length === 0 ? (
          <div className="empty-chat-list">
            <p>No conversations yet</p>
            <button
              className="btn-new-chat"
              style={{ margin: '0 auto' }}
              onClick={() => setIsModalOpen(true)}
            >
              Start First Chat
            </button>
          </div>
        ) : (
          chats.map((chat) => {
            const displayName =
              chat.otherMember?.name || `Chat #${chat.chatId}`;
            const displayEmail = chat.otherMember?.email || `Members: ${chat.members.join(', ')}`;

            return (
              <div
                key={chat.chatId}
                className={`chat-item ${activeChatId === chat.chatId ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.chatId)}
              >
                <div className="chat-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="chat-info">
                  <div className="chat-title-row">
                    <span className="chat-name">{displayName}</span>
                    <span className="chat-id-badge">#{chat.chatId}</span>
                  </div>
                  <div className="chat-preview">{displayEmail}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Chat Modal (Screen 4: New Chat) */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Start New Conversation</h3>
              <button
                className="btn-close-modal"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {availableUsers.length === 0 ? (
                <div className="empty-chat-list">No other users found</div>
              ) : (
                availableUsers.map((user) => (
                  <div key={user.id} className="select-user-item">
                    <div className="select-user-left">
                      <div className="chat-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn-start-chat"
                      disabled={creating}
                      onClick={() => handleStartChat(user.id)}
                    >
                      {creating ? 'Starting...' : 'Chat'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
