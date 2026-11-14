import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { User } from './types/user.types';
import { userService } from './services/userService';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';

export function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setFetchError(null);
        const data = await userService.getAllUsers();
        setUsers(data);
        if (data.length > 0 && !currentUser) {
          // Default to first user or leave null for demo selection
          const savedUserId = localStorage.getItem('demo_user_id');
          const found = data.find((u) => u.id === Number(savedUserId));
          if (found) {
            setCurrentUser(found);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not connect to backend server';
        setFetchError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('demo_user_id', String(user.id));
  };

  if (fetchError) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#ef4444' }}>Backend Connection Error</h2>
        <p style={{ color: '#64748b' }}>{fetchError}</p>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>
          Please make sure the backend server is running on http://localhost:5000
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to="/chat" replace />
            ) : (
              <HomePage
                users={users}
                onSelectUser={handleSelectUser}
                loading={loading}
              />
            )
          }
        />
        <Route
          path="/chat"
          element={
            currentUser ? (
              <ChatPage
                currentUser={currentUser}
                allUsers={users}
                onSwitchUser={handleSelectUser}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
