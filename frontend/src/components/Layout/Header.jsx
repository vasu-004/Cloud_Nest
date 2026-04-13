// src/components/Layout/Header.jsx
import { Search, RefreshCw, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ title }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'DU';

  return (
    <header className="top-header">
      <div className="header-title">{title}</div>
      
      <div className="header-right">
        <div className="search-bar">
          <Search />
          <input type="text" placeholder="Search anything..." />
        </div>
        
        <div className="header-actions">
          <button 
            className="icon-btn theme-toggle" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="icon-btn">
            <RefreshCw size={16} />
          </button>
          
          <div className="user-profile">
            <div className="user-avatar" style={{ overflow: 'hidden', background: user?.avatar ? 'transparent' : 'var(--bg-widget)', border: user?.avatar ? '2px solid var(--accent-cyan)' : '1px solid var(--border)' }}>
              {user?.avatar ? (
                <img 
                  src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${user.avatar}`} 
                  alt="avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Demo User'}</span>
              <span className="user-account">{user?.role?.toUpperCase() || 'Switch account'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
