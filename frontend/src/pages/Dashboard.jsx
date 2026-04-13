import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFiles } from '../services/fileService';
import { getMembers } from '../services/memberService';
import MainLayout from '../components/Layout/MainLayout';
import DropZone from '../components/FileUpload/DropZone';
import FileList from '../components/FileUpload/FileList';
import toast from 'react-hot-toast';
import { Cloud, HardDrive, FileText, PieChart, MoreVertical, Plus, Zap, Lock, Unlock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

// Helper for relative time
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [filesRes, membersRes] = await Promise.all([
        getFiles(),
        getMembers()
      ]);
      setFiles(filesRes.data.files);
      setMembers(membersRes.data.data);
    } catch {
      toast.error('Could not load your workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Real Data Calculation ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const count = files.length;
    
    // Limits
    const LITE_LIMIT = 50 * 1024 * 1024 * 1024;
    const usagePercent = Math.min(Math.round((totalBytes / LITE_LIMIT) * 100), 100);

    // Format size for display
    const format = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Distribution calculation
    const categories = [
      { name: 'Images', color: '#00A3FF', max: 20, mimePrefix: 'image/' },
      { name: 'Videos', color: '#FF3366', max: 50, mimePrefix: 'video/' },
      { name: 'Audios', color: '#FF9900', max: 10, mimePrefix: 'audio/' },
      { name: 'Files',  color: '#FFCC00', max: 20, mimePrefix: '' },
    ];

    const distribution = categories.map(cat => {
      const catFiles = files.filter(f => 
        cat.mimePrefix ? f.mimeType?.startsWith(cat.mimePrefix) : 
        !['image/', 'video/', 'audio/'].some(pre => f.mimeType?.startsWith(pre))
      );
      const catBytes = catFiles.reduce((sum, f) => sum + (f.size || 0), 0);
      const gbValue = parseFloat((catBytes / (1024 * 1024 * 1024)).toFixed(2));
      return { ...cat, value: gbValue };
    });

    return { 
        formattedSize: format(totalBytes), 
        count, 
        usagePercent,
        totalBytes,
        distribution
    };
  }, [files]);

  // Dynamic Trends Data (last 6 months)
  const trendsData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        monthNum: d.getMonth(),
        year: d.getFullYear(),
        Images: 0, Videos: 0, Files: 0, Audios: 0
      });
    }

    files.forEach(file => {
      const date = new Date(file.createdAt);
      const month = date.getMonth();
      const year = date.getFullYear();
      const entry = months.find(m => m.monthNum === month && m.year === year);
      
      if (entry) {
        const sizeGB = (file.size || 0) / (1024 * 1024 * 1024);
        if (file.mimeType.startsWith('image/')) entry.Images += sizeGB;
        else if (file.mimeType.startsWith('video/')) entry.Videos += sizeGB;
        else if (file.mimeType.startsWith('audio/')) entry.Audios += sizeGB;
        else entry.Files += sizeGB;
      }
    });

    return months.map(m => ({
      ...m,
      Images: parseFloat(m.Images.toFixed(3)),
      Videos: parseFloat(m.Videos.toFixed(3)),
      Files: parseFloat(m.Files.toFixed(3)),
      Audios: parseFloat(m.Audios.toFixed(3))
    }));
  }, [files]);


  // Dynamic Pie Data
  const pieData = useMemo(() => [
    { name: 'Used', value: stats.totalBytes, fill: 'var(--accent-cyan)' },
    { name: 'Free', value: Math.max(0, (50 * 1024 * 1024 * 1024) - stats.totalBytes), fill: 'rgba(255,255,255,0.05)' }
  ], [stats.totalBytes]);

  return (
    <MainLayout title="Overview">
      <div className="welcome-text">
        Welcome! <span>{user?.name?.split(' ')[0] || 'User'}</span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '4px' }}>
          CloudNest storage analytics provides a concise snapshot of your cloud storage usage.
        </p>
      </div>

      <div className="dash-layout">
        {/* Main Left Column */}
        <div className="main-column">
          
          {/* Cloud Cards Row */}
          <div className="cloud-cards-row">
            <div className="cloud-card" style={{ border: '1px solid var(--accent-cyan-light)', background: 'linear-gradient(145deg, var(--bg-card), #162444)' }}>
              <div className="badge" style={{color: 'var(--accent-cyan)', background: 'rgba(0, 163, 255, 0.1)'}}>Free</div>
              <div className="cloud-card-icon" style={{color: 'var(--accent-cyan)'}}>
                <Zap fill="var(--accent-cyan)" size={20} />
              </div>
              <h4>Nest Lite</h4>
              <p>{stats.formattedSize}<span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>/50GB</span></p>
            </div>
            <div className="cloud-card">
              <div className="badge" style={{color: '#10b981'}}>Paid</div>
              <div className="cloud-card-icon" style={{color: '#10b981'}}>
                <HardDrive size={20} />
              </div>
              <h4>Nest Plus</h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {user?.tier === 'lite' ? (
                  <Lock size={14} style={{ opacity: 0.6, color: 'var(--text-secondary)' }} />
                ) : (
                  <Unlock size={14} style={{ color: 'var(--accent-cyan)' }} />
                )}
                <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>/2TB</span>
              </p>
            </div>
            <div className="cloud-card" style={{ background: 'linear-gradient(145deg, #2d1b4e, #0f172a)' }}>
              <div className="badge" style={{color: '#8b5cf6'}}>Paid</div>
              <div className="cloud-card-icon" style={{color: '#06b6d4'}}>
                <Cloud size={20} />
              </div>
              <h4>Nest Pro</h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {user?.tier !== 'pro' ? (
                  <Lock size={14} style={{ opacity: 0.6, color: 'var(--text-secondary)' }} />
                ) : (
                  <Unlock size={14} style={{ color: '#8b5cf6' }} />
                )}
                <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>/10TB</span>
              </p>
            </div>
          </div>

          {/* Analytics Row */}
          <div className="analytics-row">
            {/* Total Files Bar Chart Widget */}
            <div className="widget" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="widget-header">
                <div>
                  <div className="widget-title" style={{color: 'var(--text-secondary)', fontSize: '0.75rem'}}>Vault Storage</div>
                  <div className="widget-title" style={{fontSize: '1.25rem'}}>{stats.count} Total Files</div>
                </div>
                <MoreVertical size={16} color="var(--text-muted)" />
              </div>
              
              <div className="type-bars-container">
                {stats.distribution.map(type => (
                  <div key={type.name} className="type-bar-col">
                    <span className="count">{type.value}GB</span>
                    <div className="type-bar-track">
                      <div className="type-bar-fill striped-bg" style={{ height: `${Math.max(5, (type.value/type.max)*100)}%`, backgroundColor: type.color }}></div>
                    </div>
                    <span className="label">{type.name}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Storage Analytics Line Chart */}
            <div className="widget">
              <div className="widget-header">
                <div>
                  <div className="widget-title" style={{color: 'var(--text-secondary)', fontSize: '0.75rem'}}>Based on Storage</div>
                  <div className="widget-title">Storage Analytics</div>
                </div>
                <MoreVertical size={16} color="var(--text-muted)" />
              </div>
              
              {/* Legend (mock) */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '0.7rem' }}>
                <span style={{ color: '#00A3FF'}}>■ Images</span>
                <span style={{ color: '#FF3366'}}>■ Videos</span>
                <span style={{ color: '#FFCC00'}}>■ Files</span>
                <span style={{ color: '#FF9900'}}>■ Audios</span>
              </div>

              <div style={{ height: 180, width: '100%', marginLeft: '-20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-muted)'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-muted)'}} />
                    <Tooltip contentStyle={{background: 'var(--bg-widget)', border: 'none', borderRadius: '8px'}} />
                    <Line type="monotone" dataKey="Images" stroke="#00A3FF" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Videos" stroke="#FF3366" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Files" stroke="#FFCC00" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Audios" stroke="#FF9900" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Files Manage and Upload removed per request - Moved to File Management page */}
          
          {/* Recent Activity Section */}
          <div className="widget" style={{ marginTop: '20px' }}>
            <div className="widget-header">
              <div className="widget-title">Recent Activity</div>
              <span 
                onClick={() => navigate('/file-management')}
                style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', cursor: 'pointer' }}
              >
                View All
              </span>
            </div>
            
            <div className="activity-list" style={{ marginTop: '10px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Loading activity...
                </div>
              ) : files.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No recent activity found.
                </div>
              ) : (
                files.slice(0, 5).map((file, i) => {
                  const uploader = members.find(m => m._id === file.user)?.name || 'User';
                  const isImage = file.mimeType.startsWith('image/');
                  const isVideo = file.mimeType.startsWith('video/');
                  const isAudio = file.mimeType.startsWith('audio/');
                  
                  let iconColor = '#FFCC00'; // Default Files
                  if (isImage) iconColor = '#00A3FF';
                  if (isVideo) iconColor = '#FF3366';
                  if (isAudio) iconColor = '#FF9900';

                  return (
                    <div key={file._id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '12px 0', 
                      borderBottom: i === 4 || i === files.slice(0, 5).length - 1 ? 'none' : '1px solid var(--border-color)',
                      gap: '12px'
                    }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        background: `${iconColor}15`, 
                        color: iconColor, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white' }}>
                          {file.originalName.length > 25 ? file.originalName.substring(0, 25) + '...' : file.originalName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--accent-cyan)' }}>{uploader}</span> uploaded a new file
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{file.sizeFormatted}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{timeAgo(file.createdAt)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Side Right Column */}
        <div className="side-column">
          
          <div className="storage-overview-row">
             <div className="storage-box">
                <h5>50GB</h5>
                <p>Total Storage</p>
             </div>
             <div className="storage-box" style={{ background: 'rgba(236, 72, 153, 0.05)', borderColor: 'rgba(236, 72, 153, 0.1)' }}>
                <h5 style={{color: 'var(--accent-pink)'}}>{stats.formattedSize}</h5>
                <p>Total Used</p>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
            {stats.distribution.map(type => (
              <div key={type.name} className="widget" style={{ padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: `${type.color}20`, color: type.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                   <FileText size={12} />
                 </div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{type.name}</div>
                 <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{type.value}GB</div>
              </div>
            ))}
          </div>

          {/* Donut Chart */}
          <div className="widget" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Storage</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Used</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
               <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Total 50 GB</div>
               <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--success)' }}>{stats.usagePercent}%</div>
            </div>
            
            <div style={{ height: 200, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                 <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.formattedSize}</div>
                 <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Used Storage</div>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Members</div>
              <span 
                onClick={() => navigate('/members')}
                style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', cursor: 'pointer' }}
              >
                See All
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', marginLeft: '8px' }}>
                {members.slice(0, 3).map((m, i) => (
                  <div key={m._id} style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    background: 'var(--bg-widget)', 
                    marginLeft: i === 0 ? '0' : '-10px', 
                    border: '2px solid var(--bg-card)',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${m.avatar || m.name}`} 
                      style={{width: '100%', height: '100%'}} 
                      alt="user" 
                    />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                {members.length > 3 ? `+${members.length - 3} Members` : `${members.length} Total`}
              </span>
              <button 
                onClick={() => navigate('/members')}
                className="icon-btn" 
                style={{ marginLeft: 'auto', width: 28, height: 28 }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
