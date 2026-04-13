import { LogOut, Cloud } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-icon">
            <Cloud size={20} color="white" />
          </div>
          Cloud<span>Vault</span>
        </div>

        {/* User info + logout */}
        {user && (
          <div className="navbar-user">
            <div className="navbar-avatar">{initials}</div>
            <span className="navbar-name">{user.name}</span>
            <button className="btn-logout" onClick={handleLogout}>
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
