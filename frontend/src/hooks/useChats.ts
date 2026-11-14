import { useState, useEffect, useCallback } from 'react';
import type { Chat } from '../types/chat.types';
import { chatService } from '../services/chatService';

export function useChats(currentUserId: number | null) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    if (!currentUserId) {
      setChats([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await chatService.getUserChats(currentUserId);
      setChats(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch chats';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const createChatWithUser = async (otherUserId: number): Promise<number> => {
    if (!currentUserId) throw new Error('No user selected');
    const res = await chatService.createOrGetChat(currentUserId, otherUserId);
    await fetchChats();
    return res.chatId;
  };

  return {
    chats,
    loading,
    error,
    refreshChats: fetchChats,
    createChatWithUser,
  };
}
