import { firestore, FieldValue, Timestamp } from '../../config/firebase';
import {
  ChatMessage,
  FirestoreMessageDoc,
  MessagesResponse,
  LastSeenInfo,
} from './message.types';
import { ApiError } from '../../utils/ApiError';

export class MessageService {
  private getChatDoc(chatId: number) {
    return firestore.collection('chats').doc(String(chatId));
  }

  private getMessagesCollection(chatId: number) {
    return this.getChatDoc(chatId).collection('messages');
  }

  private getLastSeenCollection(chatId: number) {
    return this.getChatDoc(chatId).collection('lastSeen');
  }

  /**
   * API 2: Send Message
   * Saves message in Firestore with server timestamp and readBy initialized to [senderId].
   */
  async sendMessage(chatId: number, senderId: number, text: string): Promise<ChatMessage> {
    const messagesCol = this.getMessagesCollection(chatId);
    const newDocRef = messagesCol.doc();
    const now = new Date();

    const messageData: FirestoreMessageDoc = {
      senderId,
      text: text.trim(),
      timestamp: FieldValue.serverTimestamp(),
      readBy: [senderId],
    };

    await newDocRef.set(messageData);

    return {
      messageId: newDocRef.id,
      chatId,
      senderId,
      text: text.trim(),
      timestamp: now.toISOString(),
      readBy: [senderId],
    };
  }

  /**
   * API 3: Get Messages with cursor-based pagination in chronological order.
   */
  async getMessages(
    chatId: number,
    limit: number = 50,
    cursor?: string
  ): Promise<MessagesResponse> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const messagesCol = this.getMessagesCollection(chatId);

    let query = messagesCol
      .orderBy('timestamp', 'asc')
      .orderBy('__name__', 'asc')
      .limit(safeLimit + 1);

    if (cursor) {
      const cursorDoc = await messagesCol.doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > safeLimit;
    const docs = hasMore ? snapshot.docs.slice(0, safeLimit) : snapshot.docs;

    const messages: ChatMessage[] = docs.map((doc) => {
      const data = doc.data();
      const rawTimestamp = data.timestamp;
      let isoTimestamp = new Date().toISOString();

      if (rawTimestamp instanceof Timestamp) {
        isoTimestamp = rawTimestamp.toDate().toISOString();
      } else if (rawTimestamp && typeof rawTimestamp.toDate === 'function') {
        isoTimestamp = rawTimestamp.toDate().toISOString();
      } else if (typeof rawTimestamp === 'string') {
        isoTimestamp = rawTimestamp;
      }

      return {
        messageId: doc.id,
        chatId,
        senderId: Number(data.senderId),
        text: String(data.text),
        timestamp: isoTimestamp,
        readBy: Array.isArray(data.readBy) ? data.readBy.map(Number) : [],
      };
    });

    const nextCursor = hasMore && docs.length > 0 ? (docs[docs.length - 1]?.id ?? null) : null;

    return {
      messages,
      pagination: {
        limit: safeLimit,
        nextCursor,
        hasMore,
      },
    };
  }

  /**
   * API 4: Mark Message Read
   * Idempotent read receipt update.
   */
  async markMessageAsRead(
    chatId: number,
    messageId: string,
    userId: number
  ): Promise<{ readBy: number[] }> {
    const docRef = this.getMessagesCollection(chatId).doc(messageId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw ApiError.notFound(`Message with id ${messageId} not found in chat ${chatId}`);
    }

    const data = docSnap.data();
    const senderId = Number(data?.senderId);
    let currentReadBy: number[] = Array.isArray(data?.readBy) ? data.readBy.map(Number) : [];

    // The prompt requirement: "Do not allow the sender to be marked as a recipient of their own message."
    if (senderId === userId) {
      // Sender is already readBy their own message; do not alter receipt
      return { readBy: currentReadBy };
    }

    // Atomic and idempotent array union in Firestore
    if (!currentReadBy.includes(userId)) {
      await docRef.update({
        readBy: FieldValue.arrayUnion(userId),
      });
      currentReadBy = [...currentReadBy, userId];
    }

    return { readBy: currentReadBy };
  }

  /**
   * API 5: Update Last Seen Message
   * Updates last-seen position for user in chat. Prevents moving backwards.
   */
  async updateLastSeen(
    chatId: number,
    userId: number,
    messageId: string
  ): Promise<LastSeenInfo> {
    const messagesCol = this.getMessagesCollection(chatId);
    const newMsgDoc = await messagesCol.doc(messageId).get();

    if (!newMsgDoc.exists) {
      throw ApiError.notFound(`Message with id ${messageId} not found in chat ${chatId}`);
    }

    const newMsgData = newMsgDoc.data();
    const newMsgTimestamp = newMsgData?.timestamp instanceof Timestamp
      ? newMsgData.timestamp.toMillis()
      : (newMsgData?.timestamp?.toDate ? newMsgData.timestamp.toDate().getTime() : Date.now());

    const lastSeenDocRef = this.getLastSeenCollection(chatId).doc(String(userId));
    const currentLastSeenSnap = await lastSeenDocRef.get();

    if (currentLastSeenSnap.exists) {
      const currentLastSeenData = currentLastSeenSnap.data();
      const currentMsgId = currentLastSeenData?.lastSeenMessageId;

      if (currentMsgId && currentMsgId !== messageId) {
        const currentMsgDoc = await messagesCol.doc(currentMsgId).get();
        if (currentMsgDoc.exists) {
          const currentMsgData = currentMsgDoc.data();
          const currentMsgTimestamp = currentMsgData?.timestamp instanceof Timestamp
            ? currentMsgData.timestamp.toMillis()
            : (currentMsgData?.timestamp?.toDate ? currentMsgData.timestamp.toDate().getTime() : 0);

          if (newMsgTimestamp < currentMsgTimestamp) {
            throw ApiError.badRequest(
              'Cannot move last seen backwards to an earlier message'
            );
          }
        }
      }
    }

    await lastSeenDocRef.set(
      {
        userId,
        lastSeenMessageId: messageId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      userId,
      lastSeenMessageId: messageId,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Helper to retrieve all lastSeen records for a chat.
   */
  async getChatLastSeen(chatId: number): Promise<Record<string, { lastSeenMessageId: string; updatedAt: string }>> {
    const snapshot = await this.getLastSeenCollection(chatId).get();
    const result: Record<string, { lastSeenMessageId: string; updatedAt: string }> = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      let updatedAt = new Date().toISOString();
      if (data.updatedAt instanceof Timestamp) {
        updatedAt = data.updatedAt.toDate().toISOString();
      }
      result[doc.id] = {
        lastSeenMessageId: data.lastSeenMessageId,
        updatedAt,
      };
    });

    return result;
  }
}
