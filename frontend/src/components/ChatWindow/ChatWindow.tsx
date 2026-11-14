import React, { useEffect, useRef } from 'react';
import type { Chat } from '../../types/chat.types';
import type { User } from '../../types/user.types';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { MessageInput } from '../MessageInput/MessageInput';
import { useMessages } from '../../hooks/useMessages';
import './ChatWindow.css';

interface ChatWindowProps {
  chat: Chat | null;
  currentUser: User | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, currentUser }) => {
  const {
    messages,
    pagination,
    loading,
    loadingMore,
    error,
    lastSeenMap,
    loadMoreMessages,
    sendMessage,
  } = useMessages(chat?.chatId ?? null, currentUser?.id ?? null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (!loadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, loadingMore]);

  if (!chat || !currentUser) {
    return (
      <div className="no-chat-selected">
        <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
        <h3 style={{ margin: 0, color: '#334155', fontWeight: 600 }}>
          Select a Conversation
        </h3>
        <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
          Choose a chat from the left panel or start a new conversation
        </p>
      </div>
    );
  }

  const otherMemberName = chat.otherMember?.name || `Participant`;
  const otherMemberEmail = chat.otherMember?.email || '';
  const otherMemberId = chat.otherMember?.id;

  // Determine which message was last seen by the other participant
  const otherLastSeenMsgId = otherMemberId
    ? lastSeenMap[String(otherMemberId)]?.lastSeenMessageId
    : undefined;

  return (
    <div className="chat-window-container">
      {/* Header */}
      <div className="chat-window-header">
        <div className="chat-header-user">
          <div className="chat-header-avatar">
            {otherMemberName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="chat-header-name">{otherMemberName}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {otherMemberEmail} • Chat #{chat.chatId}
            </div>
          </div>
        </div>
        <div className="chat-header-status">
          <span className="status-dot"></span> Online
        </div>
      </div>

      {/* Error Banner */}
      {error && <div className="chat-error-banner">{error}</div>}

      {/* Messages Scroll Area */}
      <div className="messages-scroll-area" ref={scrollContainerRef}>
        {pagination.hasMore && (
          <div className="load-more-container">
            <button
              className="btn-load-more"
              onClick={loadMoreMessages}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading older messages...' : 'Load older messages'}
            </button>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="empty-messages-state">
            <div className="empty-messages-text">Loading conversation...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-messages-state">
            <div className="empty-messages-icon">👋</div>
            <div className="empty-messages-text">No messages yet</div>
            <div className="empty-messages-sub">
              Say hello to start the conversation!
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.messageId}
              message={msg}
              isCurrentUser={msg.senderId === currentUser.id}
              isLastSeenByOther={msg.messageId === otherLastSeenMsgId}
              otherUserName={otherMemberName}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={async (text) => {
          await sendMessage(text);
        }}
      />
    </div>
  );
};
