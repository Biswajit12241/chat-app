import React from 'react';
import type { ChatMessage } from '../../types/message.types';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  isLastSeenByOther?: boolean;
  otherUserName?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  isLastSeenByOther = false,
  otherUserName = 'Recipient',
}) => {
  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // If sent by current user and readBy contains other participants
  const isReadByOther = isCurrentUser && message.readBy.length > 1;

  return (
    <div className={`message-bubble-wrapper ${isCurrentUser ? 'sent' : 'received'}`}>
      <div className={`message-bubble ${isCurrentUser ? 'sent' : 'received'}`}>
        <div className="message-text">{message.text}</div>
        <div className="message-footer">
          <span>{formatTime(message.timestamp)}</span>
          {isCurrentUser && (
            <span className="message-status-icon" title={isReadByOther ? 'Read' : 'Sent'}>
              {isReadByOther ? (
                <span className="read-check-double">✓✓</span>
              ) : (
                <span className="read-check-single">✓</span>
              )}
            </span>
          )}
        </div>
        {isCurrentUser && isLastSeenByOther && (
          <div className="last-seen-indicator">
            Seen by {otherUserName}
          </div>
        )}
      </div>
    </div>
  );
};
