/**
 * Comprehensive Backend API Test Suite
 * Tests all 6 mandatory APIs and edge cases
 */
import assert from 'assert';
import app from '../app';
import { Server } from 'http';

const PORT = 5099;
let server: Server;
const BASE_URL = `http://localhost:${PORT}`;

async function request(path: string, options: RequestInit = {}): Promise<{ status: number; body: any }> {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { status: res.status, body };
}

async function runTests() {
  console.log('--- Starting API Integration Tests ---');
  server = app.listen(PORT);

  try {
    // 1. Health check
    const health = await request('/health');
    assert.strictEqual(health.status, 200, 'Health check should return 200');
    assert.strictEqual(health.body.status, 'healthy');
    console.log('✓ Health check passed');

    // 2. Fetch demo users
    const usersRes = await request('/users');
    assert.strictEqual(usersRes.status, 200);
    assert.strictEqual(usersRes.body.success, true);
    assert.ok(Array.isArray(usersRes.body.users) && usersRes.body.users.length >= 2);
    console.log(`✓ User listing passed (${usersRes.body.users.length} users available)`);

    // 3. API 1: Self chat validation
    const selfChat = await request('/chat/create', {
      method: 'POST',
      body: JSON.stringify({ userAId: 1, userBId: 1 }),
    });
    assert.strictEqual(selfChat.status, 400);
    assert.strictEqual(selfChat.body.success, false);
    console.log('✓ Self-chat prevention passed');

    // 4. API 1: Non-existent user validation
    const nonExistent = await request('/chat/create', {
      method: 'POST',
      body: JSON.stringify({ userAId: 1, userBId: 99999 }),
    });
    assert.strictEqual(nonExistent.status, 404);
    assert.strictEqual(nonExistent.body.success, false);
    console.log('✓ Non-existent user validation passed');

    // 5. API 1: Create or get chat (User 1 and User 3)
    const createChatRes = await request('/chat/create', {
      method: 'POST',
      body: JSON.stringify({ userAId: 1, userBId: 3 }),
    });
    assert.ok(createChatRes.status === 200 || createChatRes.status === 201);
    assert.strictEqual(createChatRes.body.success, true);
    assert.ok(createChatRes.body.chatId > 0);
    const testChatId = createChatRes.body.chatId;
    console.log(`✓ API 1 Create/Get chat passed (chatId: ${testChatId})`);

    // 6. API 1: Duplicate chat creation idempotency
    const duplicateRes = await request('/chat/create', {
      method: 'POST',
      body: JSON.stringify({ userAId: 3, userBId: 1 }),
    });
    assert.strictEqual(duplicateRes.status, 200);
    assert.strictEqual(duplicateRes.body.chatId, testChatId);
    assert.strictEqual(duplicateRes.body.message, 'Chat already exists');
    console.log('✓ API 1 Duplicate chat prevention passed');

    // 7. API 2: Empty message validation
    const emptyMsg = await request(`/chat/${testChatId}/message/send`, {
      method: 'POST',
      body: JSON.stringify({ senderId: 1, text: '   ' }),
    });
    assert.strictEqual(emptyMsg.status, 400);
    console.log('✓ Empty message rejection passed');

    // 8. API 2: Unauthorized participant validation (User 2 is not in 1-3 chat)
    const unauthorizedMsg = await request(`/chat/${testChatId}/message/send`, {
      method: 'POST',
      body: JSON.stringify({ senderId: 2, text: 'Unauthorized message' }),
    });
    assert.strictEqual(unauthorizedMsg.status, 403);
    console.log('✓ API 2 Unauthorized chat membership check passed');

    // 9. API 2: Send valid message
    const sendRes1 = await request(`/chat/${testChatId}/message/send`, {
      method: 'POST',
      body: JSON.stringify({ senderId: 1, text: 'Hello Amit! Automated test message 1' }),
    });
    assert.strictEqual(sendRes1.status, 201);
    assert.strictEqual(sendRes1.body.success, true);
    assert.ok(sendRes1.body.message.messageId);
    const msg1Id = sendRes1.body.message.messageId;
    console.log(`✓ API 2 Send message passed (msg1Id: ${msg1Id})`);

    const sendRes2 = await request(`/chat/${testChatId}/message/send`, {
      method: 'POST',
      body: JSON.stringify({ senderId: 3, text: 'Hi Biswajit! Reply test message 2' }),
    });
    assert.strictEqual(sendRes2.status, 201);
    const msg2Id = sendRes2.body.message.messageId;
    console.log(`✓ API 2 Send second message passed (msg2Id: ${msg2Id})`);

    // 10. API 3: Get messages
    const getMsgsRes = await request(`/chat/${testChatId}/messages?limit=50`);
    assert.strictEqual(getMsgsRes.status, 200);
    assert.strictEqual(getMsgsRes.body.success, true);
    assert.ok(Array.isArray(getMsgsRes.body.messages) && getMsgsRes.body.messages.length >= 2);
    console.log(`✓ API 3 Get messages passed (${getMsgsRes.body.messages.length} messages)`);

    // 11. API 3: Pagination with limit=1
    const pagedRes = await request(`/chat/${testChatId}/messages?limit=1`);
    assert.strictEqual(pagedRes.status, 200);
    assert.strictEqual(pagedRes.body.messages.length, 1);
    assert.strictEqual(pagedRes.body.pagination.hasMore, true);
    assert.ok(pagedRes.body.pagination.nextCursor);
    console.log('✓ API 3 Message pagination limit=1 passed');

    // 12. API 4: Mark message as read
    const markReadRes = await request(`/chat/${testChatId}/message/${msg1Id}/read`, {
      method: 'POST',
      body: JSON.stringify({ userId: 3 }),
    });
    assert.strictEqual(markReadRes.status, 200);
    assert.strictEqual(markReadRes.body.success, true);
    assert.ok(markReadRes.body.readBy.includes(3));
    console.log('✓ API 4 Mark message read passed');

    // 13. API 4: Repeated mark read (idempotence)
    const repeatedReadRes = await request(`/chat/${testChatId}/message/${msg1Id}/read`, {
      method: 'POST',
      body: JSON.stringify({ userId: 3 }),
    });
    assert.strictEqual(repeatedReadRes.status, 200);
    assert.strictEqual(repeatedReadRes.body.readBy.filter((id: number) => id === 3).length, 1);
    console.log('✓ API 4 Read receipt idempotence passed');

    // 14. API 5: Update last seen
    const lastSeen1 = await request(`/chat/${testChatId}/lastseen`, {
      method: 'POST',
      body: JSON.stringify({ userId: 3, messageId: msg1Id }),
    });
    assert.strictEqual(lastSeen1.status, 200);
    assert.strictEqual(lastSeen1.body.lastSeen.lastSeenMessageId, msg1Id);
    console.log('✓ API 5 Update last seen passed');

    const lastSeen2 = await request(`/chat/${testChatId}/lastseen`, {
      method: 'POST',
      body: JSON.stringify({ userId: 3, messageId: msg2Id }),
    });
    assert.strictEqual(lastSeen2.status, 200);
    assert.strictEqual(lastSeen2.body.lastSeen.lastSeenMessageId, msg2Id);
    console.log('✓ API 5 Advance last seen passed');

    // 15. API 5: Prevent moving last seen backwards
    const backwardLastSeen = await request(`/chat/${testChatId}/lastseen`, {
      method: 'POST',
      body: JSON.stringify({ userId: 3, messageId: msg1Id }),
    });
    assert.strictEqual(backwardLastSeen.status, 400);
    console.log('✓ API 5 Prevent backward last seen passed');

    // 16. API 6: List user chats
    const userChats = await request('/user/1/chats');
    assert.strictEqual(userChats.status, 200);
    assert.strictEqual(userChats.body.success, true);
    assert.ok(Array.isArray(userChats.body.chats) && userChats.body.chats.length > 0);
    const chatItem = userChats.body.chats.find((c: any) => c.chatId === testChatId);
    assert.ok(chatItem, 'Created chat should be listed in user chats');
    assert.ok(chatItem.members.includes(1) && chatItem.members.includes(3));
    console.log('✓ API 6 List user chats passed');

    console.log('\n========================================');
    console.log('🎉 ALL BACKEND API TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  if (server) server.close();
  process.exit(1);
});
