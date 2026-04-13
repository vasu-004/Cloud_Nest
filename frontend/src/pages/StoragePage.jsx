// src/pages/StoragePage.jsx
import { useEffect, useState, useMemo } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { getFiles } from '../services/fileService';
import { HardDrive, Cloud, FileText, MoreVertical, Zap, Lock, Unlock } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function StoragePage() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      const res = await getFiles();
      setFiles(res.data.files);
    } catch {
      toast.error('Could not load storage data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ─── Real Data Calculation ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const count = files.length;
    
    // Limits
    const LITE_LIMIT = 50 * 1024 * 1024 * 1024; // 50GB
    const usagePercent = Math.min(Math.round((totalBytes / LITE_LIMIT) * 100), 100);


    // Calculate Categorized Distribution for the Bar Chart
    const categories = [
      { name: 'Images', color: '#00A3FF', max: 20, mimePrefix: 'image/' },
      { name: 'Videos', color: '#FF3366', max: 50, mimePrefix: 'video/' },
      { name: 'Audios', color: '#FF9900', max: 10, mimePrefix: 'audio/' },
      { name: 'Files',  color: '#FFCC00', max: 20, mimePrefix: '' }, // Fallback for others
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
        formattedSize: formatSize(totalBytes), 
        count, 
        usagePercent,
        totalBytes,
        distribution
    };
  }, [files]);


  // Pie Data
  const pieData = [
    { name: 'Used', value: stats.totalBytes, fill: 'var(--accent-cyan)' },
    { name: 'Free', value: Math.max(0, (50 * 1024 * 1024 * 1024) - stats.totalBytes), fill: 'rgba(255,255,255,0.05)' }
  ];

  return (
    <MainLayout title="Storage Overview">
      <div className="welcome-text">
        Storage <span>Analytics</span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '4px' }}>
          Detailed breakdown of the {stats.count} files currently stored within CloudNest.
        </p>
      </div>

      <div className="dash-layout">
        <div className="main-column">
          {/* Cloud Cards Row */}
          <div className="cloud-cards-row">
            <div className="cloud-card" style={{ border: '1px solid var(--accent-cyan)', background: 'linear-gradient(145deg, var(--bg-card), #162444)' }}>
              <div className="badge" style={{color: 'var(--accent-cyan)', background: 'rgba(0, 163, 255, 0.1)'}}>Free</div>
              <div className="cloud-card-icon" style={{color: 'var(--accent-cyan)'}}><Zap size={22} fill="var(--accent-cyan)" /></div>
              <h4>Nest Lite</h4>
              <p>{stats.formattedSize}<span style={{fontSize: '0.75rem', opacity: 0.6}}>/50GB</span></p>
            </div>
            <div className="cloud-card">
              <div className="badge" style={{color: '#10b981'}}>Paid</div>
              <div className="cloud-card-icon" style={{color: '#10b981'}}><HardDrive /></div>
              <h4>Nest Plus</h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {user?.tier === 'lite' ? (
                  <Lock size={14} style={{ opacity: 0.6, color: 'var(--text-secondary)' }} />
                ) : (
                  <Unlock size={14} style={{ color: 'var(--accent-cyan)' }} />
                )}
                <span style={{fontSize: '0.8rem', opacity: 0.6}}>/2TB</span>
              </p>
            </div>
            <div className="cloud-card" style={{ background: 'linear-gradient(145deg, #2d1b4e, #0f172a)' }}>
              <div className="badge" style={{color: '#8b5cf6'}}>Paid</div>
              <div className="cloud-card-icon" style={{color: '#06b6d4'}}><Cloud size={20} /></div>
              <h4>Nest Pro</h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {user?.tier !== 'pro' ? (
                  <Lock size={14} style={{ opacity: 0.6, color: 'var(--text-secondary)' }} />
                ) : (
                  <Unlock size={14} style={{ color: '#8b5cf6' }} />
                )} 
                <span style={{fontSize: '0.8rem', opacity: 0.6}}>/10TB</span>
              </p>
            </div>
          </div>

          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">File Type Distribution</div>
              <MoreVertical size={16} color="var(--text-muted)" />
            </div>
            <div className="type-bars-container" style={{ height: '300px' }}>
              {stats.distribution.map(type => (
                <div key={type.name} className="type-bar-col" style={{ width: '60px' }}>
                  <span className="count">{type.value}GB</span>
                  <div className="type-bar-track" style={{ height: '240px', width: '32px' }}>
                    <div className="type-bar-fill striped-bg" style={{ height: `${Math.max(5, (type.value/type.max)*100)}%`, backgroundColor: type.color }}></div>
                  </div>
                  <span className="label" style={{ fontSize: '0.8rem' }}>{type.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="side-column">
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">Usage Summary</div>
            </div>
            <div style={{ height: 260, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={100}
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
                 <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.usagePercent}%</div>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Used</div>
              </div>
            </div>
            <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--accent-cyan)' }}>Used Storage</span>
                    <span style={{ fontWeight: 600 }}>{stats.formattedSize}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Free Available</span>
                    <span style={{ fontWeight: 600 }}>{formatSize(Math.max(0, (50 * 1024 * 1024 * 1024) - stats.totalBytes))}</span>
                </div>

            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

