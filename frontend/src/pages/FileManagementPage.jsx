// src/pages/FileManagementPage.jsx
import { useEffect, useState } from 'react';
import { getFiles } from '../services/fileService';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/Layout/MainLayout';
import DropZone from '../components/FileUpload/DropZone';
import FileList from '../components/FileUpload/FileList';
import toast from 'react-hot-toast';
import { FolderOpen, MoreVertical } from 'lucide-react';

export default function FileManagementPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const canUpload = ['admin', 'editor', 'uploader'].includes(user?.role);

  const fetchFiles = async () => {
    try {
      const res = await getFiles();
      setFiles(res.data.files);
    } catch {
      toast.error('Could not load your files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  return (
    <MainLayout title="File Management">
      <div className="welcome-text">
        All <span>Files</span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '4px' }}>
          Manage, upload, and organize your cloud storage documents.
        </p>
      </div>

      <div className="widget" style={{ padding: '0', background: 'transparent', border: 'none' }}>
        <div className="widget-header" style={{ marginBottom: '8px' }}>
          <div className="widget-title">{canUpload ? 'Upload & Browse' : 'Browse Files'}</div>
          <MoreVertical size={16} color="var(--text-muted)" />
        </div>
        {canUpload ? (
          <DropZone onUploadSuccess={fetchFiles} />
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
             You do not have permission to upload files.
          </div>
        )}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>Your Documents</h3>
          <FileList files={files} setFiles={setFiles} loading={loading} />
        </div>
      </div>
    </MainLayout>
  );
}
