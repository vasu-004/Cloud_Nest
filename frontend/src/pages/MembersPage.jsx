import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, MoreVertical, Mail, Shield, User, Trash2, Search } from 'lucide-react';
import { getMembers, updateMemberRole, deleteMember, createMember } from '../services/memberService';
import toast from 'react-hot-toast';

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Member State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer'
  });

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await getMembers();
      setMembers(res.data.data);
    } catch (err) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await createMember(newMember);
      toast.success('Member created successfully');
      setShowAddModal(false);
      setNewMember({ name: '', email: '', password: '', role: 'viewer' });
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create member');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await updateMemberRole(id, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchMembers();
    } catch (err) {
      toast.error('Permission denied to change roles');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await deleteMember(id);
      toast.success('Member removed');
      fetchMembers();
    } catch (err) {
      toast.error('Permission denied to remove member');
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout title="Members">
      <div className="welcome-text">
        Team <span>Members</span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '4px' }}>
          Manage your team access and permissions within CloudNest.
        </p>
      </div>

      <div className="widget" style={{ padding: '0' }}>
        <div className="widget-header" style={{ padding: '20px 20px 0 20px', alignItems: 'center' }}>
          <div className="widget-title">Active Members ({filteredMembers.length})</div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
             <div className="search-bar" style={{ maxWidth: '200px', marginBottom: '0' }}>
               <Search size={14} />
               <input 
                 type="text" 
                 placeholder="Search members..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 style={{ border: 'none', background: 'transparent', color: 'white', fontSize: '0.85rem' }}
               />
             </div>
             {user?.role === 'admin' && (
               <button className="btn btn-primary btn-sm" style={{ width: 'auto' }} onClick={() => setShowAddModal(true)}>
                 <Plus size={16} /> Add Member
               </button>
             )}
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading members...</div>
          ) : (
            <div className="members-list">
              {filteredMembers.map(member => (
                <div key={member._id} className="file-list-item" style={{ padding: '16px' }}>
                  <div className="file-list-item-main">
                    <div className="user-avatar" style={{ 
                      background: 'rgba(0, 163, 255, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${member.avatar || member.name}`} 
                        alt={member.name}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                    <div>
                      <div className="file-name">{member.name} {member.isMe ? '(You)' : ''}</div>
                      <div className="file-date" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} /> {member.email}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <select 
                      value={member.role} 
                      onChange={(e) => handleRoleChange(member._id, e.target.value)}
                      disabled={user?.role !== 'admin'}
                      style={{ 
                        background: 'var(--bg-card)', 
                        color: 'var(--text-secondary)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        cursor: user?.role === 'admin' ? 'pointer' : 'not-allowed',
                        opacity: user?.role === 'admin' ? 1 : 0.7
                      }}
                    >
                      <option value="viewer">Viewer (View Only)</option>
                      <option value="downloader">Downloader (Download Only)</option>
                      <option value="uploader">Uploader (Upload Only)</option>
                      <option value="editor">Editor (Upload + Delete)</option>
                      <option value="admin">Admin (Full Access)</option>
                    </select>
                    
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleRemove(member._id)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: '#ef4444', 
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Remove Member"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <h3 className="modal-title" style={{ marginBottom: '20px' }}>Add New Member</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  type="text" required
                  className="form-input" 
                  value={newMember.name}
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email</label>
                <input 
                  type="email" required
                  className="form-input" 
                  value={newMember.email}
                  onChange={e => setNewMember({...newMember, email: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password</label>
                <input 
                  type="password" required minLength={6}
                  className="form-input" 
                  value={newMember.password}
                  onChange={e => setNewMember({...newMember, password: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Role</label>
                <select 
                  className="form-input"
                  value={newMember.role}
                  onChange={e => setNewMember({...newMember, role: e.target.value})}
                >
                  <option value="viewer">Viewer (View Only)</option>
                  <option value="downloader">Downloader (Download Only)</option>
                  <option value="uploader">Uploader (Upload Only)</option>
                  <option value="editor">Editor (Upload + Delete)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>
              
              <div className="modal-actions" style={{ marginTop: '0' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                  {addLoading ? 'Creating...' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
