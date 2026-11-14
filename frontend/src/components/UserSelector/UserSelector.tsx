import React from 'react';
import type { User } from '../../types/user.types';
import './UserSelector.css';

interface UserSelectorProps {
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  users,
  currentUser,
  onSelectUser,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    const found = users.find((u) => u.id === selectedId);
    if (found) {
      onSelectUser(found);
    }
  };

  return (
    <header className="user-selector-container">
      <div className="user-selector-info">
        <div className="user-badge">
          <div className="user-avatar">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="user-meta">
            <div className="user-meta-name">
              {currentUser?.name || 'Loading...'}
              <span className="demo-pill">Active User</span>
            </div>
            <div className="user-meta-sub">{currentUser?.email || 'Demo session'}</div>
          </div>
        </div>
      </div>

      <div className="user-selector-actions">
        <label htmlFor="user-switch" className="user-selector-label">
          Switch Identity:
        </label>
        <select
          id="user-switch"
          className="user-select-dropdown"
          value={currentUser?.id || ''}
          onChange={handleChange}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>
    </header>
  );
};
