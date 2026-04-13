import { Cloud, Grid, HardDrive, FolderOpen, Users, BarChart2, Download, HelpCircle, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { icon: <Grid size={18} />, label: 'Overview', path: '/' },
    { icon: <HardDrive size={18} />, label: 'Storage', path: '/storage' },
    { icon: <FolderOpen size={18} />, label: 'File Management', path: '/files' },
    { icon: <Users size={18} />, label: 'Members', path: '/members' },
  ];

  const reportItems = [
    { icon: <BarChart2 size={18} />, label: 'Storage Analytics', path: '/analytics' },
    { icon: <Download size={18} />, label: 'Download', path: '/files' }, // Reuse files for download
  ];

  const settingItems = [
    { icon: <HelpCircle size={18} />, label: 'Help & Support', path: '/settings' },
    { icon: <Settings size={18} />, label: 'Settings', path: '/settings' },
  ];

  const renderNavGroup = (items) => (
    items.map((item) => (
      <NavLink
        key={item.path + item.label}
        to={item.path}
        className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
      >
        {item.icon} {item.label}
      </NavLink>
    ))
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="nest-icon" style={{
          position: 'relative',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 163, 255, 0.1)',
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', // Nest shape
          border: '1px solid rgba(0, 163, 255, 0.3)',
          paddingBottom: '2px'
        }}>
          <Cloud fill="var(--accent-cyan)" color="transparent" size={18} />
        </div>
        <span className="text-gradient">CloudNest</span>
      </div>

      <div className="sidebar-section-title">General</div>
      <div className="sidebar-nav">
        {renderNavGroup(navItems)}

        <div className="sidebar-section-title">Reports</div>
        {renderNavGroup(reportItems)}

        {user?.role === 'admin' && (
          <>
            <div className="sidebar-section-title">Settings</div>
            {renderNavGroup(settingItems)}
          </>
        )}
      </div>

      <div className="sidebar-upgrade">
        <p>Unlock more storage and file formats.</p>
        <button onClick={() => navigate('/pricing')}>Explore Plans →</button>
      </div>

      <div className="sidebar-logout" onClick={handleLogout}>
        <LogOut /> Log Out
      </div>
    </aside>
  );
}
