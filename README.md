# Full-Stack Chat Application

A high-performance, production-grade Full-Stack Chat Application built with **Node.js, Express, TypeScript, MySQL 8, and Firebase Firestore**, paired with a **React.js + TypeScript** responsive frontend.

This project implements a clean hybrid database architecture:
- **MySQL 8** manages relational entities with strict referential integrity (Users, 1:1 Chats, and Chat Participants).
- **Firebase Firestore** handles high-throughput messaging, idempotent read receipts, and per-user last-seen indicators.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 React.js + TypeScript Client                │
│                 (Vite, Axios, React Router)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST Requests
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express.js Backend (Node.js)                │
│             Routes → Controllers → Services                 │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│           MySQL 8           │ │      Firebase Firestore     │
│   • users                   │ │   • chats/{id}/messages     │
│   • chats (canonical pair)  │ │   • chats/{id}/lastSeen     │
│   • chat_participants       │ │   • idempotent read receipts│
│   • transactions & checks   │ │   • cursor-based pagination │
└─────────────────────────────┘ └─────────────────────────────┘
```

> **Security Guarantee:** The React client never communicates directly with MySQL or Firebase Admin SDK. All business rules, participant validations, and authorization checks are enforced by the Node.js backend.

---

## Technology Stack

### Frontend
- **Framework:** React 19 + TypeScript (Strict Mode)
- **Bundler:** Vite
- **Routing:** React Router DOM (v7)
- **HTTP Client:** Axios
- **Styling:** Modular component CSS with responsive desktop & mobile support

### Backend
- **Runtime:** Node.js (v20+ / v26)
- **Framework:** Express.js (v5)
- **Language:** TypeScript 7 (Strict Mode: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `strict: true`)
- **Relational DB Client:** `mysql2/promise` with Connection Pooling
- **NoSQL / Cloud Client:** `firebase-admin` (Firestore SDK)
- **Configuration & Security:** `dotenv`, `cors`

### Databases
- **MySQL 8:** Structured user accounts, chat pair constraints, participant relations, and transactional integrity.
- **Firebase Firestore:** Document-store subcollections for messages and user last-seen tracking.

---

## Repository Structure

```
chat-app/
├── backend/
│   ├── secrets/
│   │   └── serviceAccountKey.json   # Protected Firebase service credentials
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # MySQL pool and transaction helpers
│   │   │   └── firebase.ts          # Firebase Admin SDK & Firestore instance
│   │   ├── middleware/
│   │   │   ├── error.middleware.ts  # Centralized error handler & MySQL error mapping
│   │   │   └── validation.middleware.ts # Type-safe request validators
│   │   ├── modules/
│   │   │   ├── users/
│   │   │   │   ├── user.types.ts
│   │   │   │   ├── user.repository.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   └── user.routes.ts
│   │   │   └── chat/
│   │   │       ├── chat.types.ts
│   │   │       ├── message.types.ts
│   │   │       ├── chat.repository.ts
│   │   │       ├── chat.service.ts
│   │   │       ├── message.service.ts
│   │   │       ├── chat.controller.ts
│   │   │       └── chat.routes.ts
│   │   ├── utils/
│   │   │   ├── ApiError.ts          # Custom operational error class
│   │   │   ├── ApiResponse.ts       # Structured API response helper
│   │   │   └── asyncHandler.ts      # Async route handler wrapper
│   │   ├── tests/
│   │   │   └── api.test.ts          # End-to-end automated API test suite
│   │   ├── app.ts                   # Express application setup & middleware
│   │   └── server.ts                # Application bootstrapper
│   ├── .env.example
│   ├── package.json
│   ├── schema.sql                   # MySQL database migration script
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatList/            # Conversations sidebar & modal
│   │   │   ├── ChatWindow/          # Active chat window with message history
│   │   │   ├── MessageBubble/       # Sent/Received bubbles with read receipts
│   │   │   ├── MessageInput/        # Message compose and send button
│   │   │   └── UserSelector/        # Active user session switcher
│   │   ├── hooks/
│   │   │   ├── useChats.ts          # Chat list fetching and creation hook
│   │   │   └── useMessages.ts       # Message polling, auto-read, and pagination hook
│   │   ├── pages/
│   │   │   ├── HomePage.tsx         # User selection & welcome screen
│   │   │   └── ChatPage.tsx         # Full-featured chat workspace
│   │   ├── services/
│   │   │   ├── api.ts               # Axios client instance
│   │   │   ├── chatService.ts       # Chat & message API integrations
│   │   │   └── userService.ts       # User identity API integrations
│   │   ├── types/
│   │   │   ├── chat.types.ts
│   │   │   ├── message.types.ts
│   │   │   └── user.types.ts
│   │   ├── App.tsx                  # App router and layout
│   │   ├── index.css                # Global styling
│   │   └── main.tsx                 # React DOM mount point
│   ├── package.json
│   └── vite.config.ts
│
├── postman_collection.json          # Ready-to-import Postman v2.1 collection
└── README.md
```

---

## Prerequisites

1. **Node.js**: v18.x or later (Node v20+ recommended).
2. **MySQL Server 8.0**: Running locally on port `3306`.
3. **Firebase Account**: Firebase project with Firestore initialized.
4. **Git** and Windows PowerShell.

---

## MySQL Setup Instructions

1. Ensure the MySQL 8.0 service is running.
2. Execute the provided `backend/schema.sql` file via MySQL Workbench or command line:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < backend\schema.sql
```

### Database Schema Design

#### Table 1: `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY AUTO_INCREMENT | Unique user identifier |
| `name` | VARCHAR(100) | NOT NULL | User's full display name |
| `email` | VARCHAR(150) | NOT NULL UNIQUE | Unique email address |
| `created_at`| TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration timestamp |

#### Table 2: `chats`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY AUTO_INCREMENT | Unique chat room identifier |
| `user_low_id` | BIGINT | NOT NULL, FK → users(id) | Smaller of the two user IDs |
| `user_high_id`| BIGINT | NOT NULL, FK → users(id) | Larger of the two user IDs |
| `created_at`| TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Room creation timestamp |

- **Unique Constraint:** `UNIQUE KEY unique_chat_pair (user_low_id, user_high_id)`
- **Check Constraint:** `CHECK (user_low_id < user_high_id)`
- Prevents duplicate 1:1 chat rooms under race conditions and ensures canonical pair ordering.

#### Table 3: `chat_participants`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT | PRIMARY KEY AUTO_INCREMENT | Participant record ID |
| `chat_id` | BIGINT | NOT NULL, FK → chats(id) | Reference to chat room |
| `user_id` | BIGINT | NOT NULL, FK → users(id) | Reference to participant user |
| `joined_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Membership start timestamp |

- **Unique Constraint:** `UNIQUE KEY unique_chat_participant (chat_id, user_id)`
- **Indexes:** Indexed on `user_id` and `chat_id` for fast join lookups.

---

## Firebase Firestore Data Architecture

```
chats (collection)
  │
  └── {chatId} (document)
        ├── messages (subcollection)
        │     └── {messageId} (document)
        │           ├── senderId: 1
        │           ├── text: "Hello!"
        │           ├── timestamp: [Firestore Server Timestamp]
        │           └── readBy: [1, 2]
        │
        └── lastSeen (subcollection)
              └── {userId} (document)
                    ├── userId: 2
                    ├── lastSeenMessageId: "message_001"
                    └── updatedAt: [Firestore Server Timestamp]
```

### Key Architectural Characteristics
1. **Idempotent Read Receipts:** Uses `FieldValue.arrayUnion(userId)` to ensure repeated reads never create duplicate reader entries.
2. **Backward-Movement Prevention:** The server strictly checks message timestamps when updating last-seen state; requests attempting to move last-seen backwards are rejected with `400 Bad Request`.
3. **Cursor-Based Pagination:** Uses Firestore composite ordering `orderBy('timestamp', 'asc').orderBy('__name__', 'asc')` to guarantee consistent pagination even across identical timestamps.

---

## Environment Variable Configuration

Create `backend/.env` with the following variables:

```env
PORT=5000

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=chat_app

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=./secrets/serviceAccountKey.json
```

Place your Firebase Service Account JSON file in `backend/secrets/serviceAccountKey.json`.

---

## Installation & Running on Windows

### 1. Backend Setup
Open a PowerShell terminal:

```powershell
cd backend

# Install dependencies
npm.cmd install

# Compile TypeScript
npm.cmd run build

# Run automated tests
npm.cmd test

# Start the server
npm.cmd start
```
The backend API will start on `http://localhost:5000`.

### 2. Frontend Setup
Open a second PowerShell terminal:

```powershell
cd frontend

# Install dependencies
npm.cmd install

# Start Vite development server
npm.cmd run dev
```
The client application will start on `http://localhost:5173`.

---

## Mandatory REST API Specifications

### API 1: Create or Get Chat
- **Route:** `POST /chat/create`
- **Description:** Finds an existing 1:1 chat between two users or creates one transactionally in MySQL.
- **Request Body:**
```json
{
  "userAId": 1,
  "userBId": 2
}
```
- **Response (200 OK / 201 Created):**
```json
{
  "success": true,
  "chatId": 1,
  "message": "Chat created successfully"
}
```

---

### API 2: Send Message
- **Route:** `POST /chat/:chatId/message/send`
- **Description:** Verifies sender membership in MySQL, generates a unique ID, and saves the message into Firestore with server timestamp.
- **Request Body:**
```json
{
  "senderId": 1,
  "text": "Hello, how are you?"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": {
    "messageId": "yoANeqakOMhHMY7uKmmE",
    "chatId": 1,
    "senderId": 1,
    "text": "Hello, how are you?",
    "timestamp": "2026-11-14T07:53:23.486Z",
    "readBy": [1]
  }
}
```

---

### API 3: Get Messages (Chronological & Paginated)
- **Route:** `GET /chat/:chatId/messages?limit=50&cursor={nextCursor}`
- **Description:** Retrieves messages in chronological order supporting cursor-based pagination.
- **Query Parameters:**
  - `limit`: Integer between 1 and 100 (default: 50).
  - `cursor`: Document ID cursor for the next page.
- **Response (200 OK):**
```json
{
  "success": true,
  "messages": [
    {
      "messageId": "yoANeqakOMhHMY7uKmmE",
      "chatId": 1,
      "senderId": 1,
      "text": "Hello, how are you?",
      "timestamp": "2026-11-14T07:53:24.556Z",
      "readBy": [1, 2]
    }
  ],
  "pagination": {
    "limit": 50,
    "nextCursor": null,
    "hasMore": false
  }
}
```

---

### API 4: Mark Message Read
- **Route:** `POST /chat/:chatId/message/:messageId/read`
- **Description:** Adds user to message `readBy` array idempotently. Sender cannot be marked as recipient of their own message.
- **Request Body:**
```json
{
  "userId": 2
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Message marked as read",
  "readBy": [1, 2]
}
```

---

### API 5: Update Last Seen Message
- **Route:** `POST /chat/:chatId/lastseen`
- **Description:** Updates the user's last-seen message document in Firestore. Strictly rejects backward progression.
- **Request Body:**
```json
{
  "userId": 2,
  "messageId": "yoANeqakOMhHMY7uKmmE"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Last seen updated successfully",
  "lastSeen": {
    "userId": 2,
    "lastSeenMessageId": "yoANeqakOMhHMY7uKmmE",
    "updatedAt": "2026-11-14T07:55:56.162Z"
  }
}
```

---

### API 6: List User Chats
- **Route:** `GET /user/:userId/chats`
- **Description:** Joins MySQL `chats`, `chat_participants`, and `users` to return all chat rooms the user belongs to, ordered by creation time descending.
- **Response (200 OK):**
```json
{
  "success": true,
  "chats": [
    {
      "chatId": 1,
      "members": [1, 2],
      "createdAt": "2026-11-14T07:52:07.000Z",
      "otherMember": {
        "id": 2,
        "name": "Rahul",
        "email": "rahul@example.com"
      }
    }
  ]
}
```

---

## Postman Testing Instructions

1. Open Postman.
2. Click **Import** and select `postman_collection.json` from the repository root.
3. The collection is configured with variables:
   - `baseUrl`: `http://localhost:5000`
   - `chatId`: `1`
   - `messageId`: (populated automatically from previous requests)
4. All 6 APIs along with edge cases (Self Chat, Empty Message, Unauthorized Sender, Invalid Limit, Move Last-Seen Backwards) are included and pre-configured.

---

## Automated Test Suite

Run the automated integration tests against your live MySQL and Firestore configuration:

```powershell
cd backend
npm.cmd test
```

Test output verifies:
- Health check & user listing
- Validation bounds (self chat, nonexistent user, empty text)
- 1:1 chat deduplication under concurrent/reversed IDs
- Firestore server timestamp writing & message dispatch
- Cursor pagination & chronological ordering
- Read receipt idempotency
- Last seen updates & backward movement prevention
- Participant authorization checks

---

## Known Limitations & Production Enhancements

1. **Authentication:** The assignment uses assignment-level user IDs in request bodies to enable straightforward demonstration and evaluator testing. In production, this would be replaced with JWT bearer tokens or Firebase Auth session tokens.
2. **Realtime Transport:** The client uses interval-based polling for near-realtime message refresh. While lightweight and robust, WebSockets or Firestore client SDK snapshot listeners can be introduced for sub-second updates if required.
