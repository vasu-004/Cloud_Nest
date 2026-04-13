// src/pages/AnalyticsPage.jsx
import { useEffect, useState, useMemo } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { getFiles } from '../services/fileService';
import { BarChart2, MoreVertical, TrendingUp, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await getFiles();
      setFiles(res.data.files);
    } catch {
      toast.error('Could not load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  // ─── Real Data Calculation ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const totalGB = parseFloat((totalBytes / (1024 * 1024 * 1024)).toFixed(2));
    
    // Monthly Uploads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const lastMonthBytes = files
      .filter(f => new Date(f.createdAt) > thirtyDaysAgo)
      .reduce((sum, f) => sum + (f.size || 0), 0);
    const lastMonthGB = (lastMonthBytes / (1024 * 1024 * 1024)).toFixed(1);

    // Peak Usage (find month with most uploads)
    const monthCounts = {};
    files.forEach(f => {
        const m = new Date(f.createdAt).toLocaleString('default', { month: 'short' });
        monthCounts[m] = (monthCounts[m] || 0) + (f.size || 0);
    });
    const peakMonth = Object.keys(monthCounts).reduce((a, b) => monthCounts[a] > monthCounts[b] ? a : b, 'N/A');

    return { totalGB, lastMonthGB, peakMonth };
  }, [files]);

  const trendsData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        monthNum: d.getMonth(),
        year: d.getFullYear(),
        Images: 0, Videos: 0, Files: 0, Total: 0
      });
    }

    files.forEach(file => {
      const date = new Date(file.createdAt);
      const m = date.getMonth();
      const y = date.getFullYear();
      const entry = months.find(entry => entry.monthNum === m && entry.year === y);
      
      if (entry) {
        const sizeGB = (file.size || 0) / (1024 * 1024 * 1024);
        if (file.mimeType.startsWith('image/')) entry.Images += sizeGB;
        else if (file.mimeType.startsWith('video/')) entry.Videos += sizeGB;
        else entry.Files += sizeGB;
        entry.Total += sizeGB;
      }
    });

    return months.map(m => ({
      ...m,
      Images: parseFloat(m.Images.toFixed(3)),
      Videos: parseFloat(m.Videos.toFixed(3)),
      Files: parseFloat(m.Files.toFixed(3)),
      Total: parseFloat(m.Total.toFixed(3))
    }));
  }, [files]);

  return (
    <MainLayout title="Analytics">
      <div className="welcome-text">
        Storage <span>Reports</span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '4px' }}>
          Deep dive into your cloud usage patterns and storage trends over time.
        </p>
      </div>

      <div className="main-column">
        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '8px' }}>
           <div className="widget" style={{ textAlign: 'center' }}>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Monthly Uploads</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>+{stats.lastMonthGB} GB</div>
             <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '4px' }}><TrendingUp size={10} /> Active Growth</div>
           </div>
           <div className="widget" style={{ textAlign: 'center' }}>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Peak Usage</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-pink)' }}>{stats.peakMonth}</div>
             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Max volume period</div>
           </div>
           <div className="widget" style={{ textAlign: 'center' }}>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Available Base</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{stats.totalGB} GB</div>
             <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '4px' }}>Real-time sync</div>
           </div>
        </div>

        {/* Big Area Chart */}
        <div className="widget">
           <div className="widget-header">
             <div className="widget-title">Traffic & Usage Trends</div>
             <button className="icon-btn"><ArrowUpRight size={16} /></button>
           </div>
           <div style={{ height: 300, width: '100%', marginLeft: '-20px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={trendsData}>
                 <defs>
                   <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-muted)'}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-muted)'}} />
                 <Tooltip contentStyle={{background: 'var(--bg-widget)', border: 'none', borderRadius: '8px'}} />
                 <Area type="monotone" dataKey="Total" stroke="var(--accent-cyan)" fillOpacity={1} fill="url(#colorUsage)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Bar Chart */}
        <div className="widget">
          <div className="widget-header">
            <div className="widget-title">Monthly Distribution by Type</div>
            <MoreVertical size={16} color="var(--text-muted)" />
          </div>
          <div style={{ height: 250, width: '100%', marginLeft: '-20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendsData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-muted)'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-muted)'}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: 'var(--bg-widget)', border: 'none', borderRadius: '8px'}} />
                <Bar dataKey="Images" fill="#00A3FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Videos" fill="#FF3366" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Files" fill="#FFCC00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

