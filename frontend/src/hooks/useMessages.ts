import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage, PaginationMeta } from '../types/message.types';
import { chatService } from '../services/chatService';

export function useMessages(chatId: number | null, currentUserId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    limit: 50,
    nextCursor: null,
    hasMore: false,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, { lastSeenMessageId: string; updatedAt: string }>>({});

  const isInitialLoad = useRef<boolean>(true);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const fetchMessages = useCallback(
    async (isBackground: boolean = false) => {
      if (!chatId) {
        setMessages([]);
        return;
      }

      try {
        if (!isBackground) setLoading(true);
        setError(null);

        const data = await chatService.getMessages(chatId, 50);
        setMessages(data.messages);
        setPagination(data.pagination);

        // Fetch last seen records
        try {
          const ls = await chatService.getLastSeen(chatId);
          setLastSeenMap(ls);
        } catch {
          // Non-critical helper
        }

        // Auto mark unread messages as read and advance last seen
        if (currentUserId && data.messages.length > 0) {
          const latestMsg = data.messages[data.messages.length - 1];

          // Find messages sent by others not yet read by current user
          const unreadMsgs = data.messages.filter(
            (m) => m.senderId !== currentUserId && !m.readBy.includes(currentUserId)
          );

          for (const msg of unreadMsgs) {
            chatService.markMessageRead(chatId, msg.messageId, currentUserId).catch(() => {});
          }

          // Advance last seen if applicable
          if (latestMsg) {
            chatService.updateLastSeen(chatId, currentUserId, latestMsg.messageId).catch(() => {});
          }
        }
      } catch (err: unknown) {
        if (!isBackground) {
          const msg = err instanceof Error ? err.message : 'Failed to load messages';
          setError(msg);
        }
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [chatId, currentUserId]
  );

  useEffect(() => {
    isInitialLoad.current = true;
    fetchMessages(false);

    // Near-realtime polling interval
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  const loadMoreMessages = async () => {
    if (!chatId || !pagination.hasMore || !pagination.nextCursor || loadingMore) return;

    try {
      setLoadingMore(true);
      const data = await chatService.getMessages(chatId, 50, pagination.nextCursor);

      setMessages((prev) => {
        // Filter out any duplicates
        const existingIds = new Set(prev.map((m) => m.messageId));
        const newOnes = data.messages.filter((m) => !existingIds.has(m.messageId));
        return [...prev, ...newOnes];
      });

      setPagination(data.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load more messages';
      setError(msg);
    } finally {
      setLoadingMore(false);
    }
  };

  const sendMessage = async (text: string): Promise<ChatMessage> => {
    if (!chatId || !currentUserId) {
      throw new Error('Chat ID or user not specified');
    }

    const created = await chatService.sendMessage(chatId, currentUserId, text);

    // Optimistically or immediately add to message list
    setMessages((prev) => {
      if (prev.some((m) => m.messageId === created.messageId)) return prev;
      return [...prev, created];
    });

    // Update last seen for sender
    chatService.updateLastSeen(chatId, currentUserId, created.messageId).catch(() => {});

    return created;
  };

  return {
    messages,
    pagination,
    loading,
    loadingMore,
    error,
    lastSeenMap,
    loadMoreMessages,
    sendMessage,
    refreshMessages: () => fetchMessages(false),
  };
}
