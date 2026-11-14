import React from 'react';
import type { User } from '../types/user.types';
import './HomePage.css';

interface HomePageProps {
  users: User[];
  onSelectUser: (user: User) => void;
  loading: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ users, onSelectUser, loading }) => {
  return (
    <div className="home-page-container">
      <div className="home-card">
        <div className="home-header">
          <div className="app-logo-badge">💬</div>
          <h1 className="home-title">Full-Stack Chat Application</h1>
          <p className="home-subtitle">
            Node.js & Express • TypeScript • MySQL 8 • Firebase Firestore
          </p>
        </div>

        <div className="assignment-notice">
          <strong>Assignment Demonstration:</strong> Select a demonstration user below to enter the chat workspace. You can switch identities at any time to test 1:1 messaging, read receipts, and last-seen synchronization.
        </div>

        <div className="users-selection-grid">
          <h3 className="section-label">Select Active User:</h3>

          {loading ? (
            <div className="loading-spinner">Loading users from MySQL...</div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="user-select-card"
                onClick={() => onSelectUser(user)}
              >
                <div className="user-card-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-card-details">
                  <div className="user-card-name">{user.name}</div>
                  <div className="user-card-email">{user.email}</div>
                  <span className="user-id-tag">User ID: #{user.id}</span>
                </div>
                <button className="btn-enter-chat">Enter Chat →</button>
              </div>
            ))
          )}
        </div>

        <div className="tech-pills-row">
          <span className="tech-pill">MySQL 8 (Users & Chats)</span>
          <span className="tech-pill">Firestore (Messages & Read Receipts)</span>
          <span className="tech-pill">Strict TypeScript</span>
          <span className="tech-pill">Vite + React</span>
        </div>
      </div>
    </div>
  );
};
