import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CloudUpload, FileImage, FileText, Zap, Music, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { uploadFile } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';
import UploadProgress from './UploadProgress';

// Accepted MIME types (All types, we filter by tier in logic)
const ACCEPTED_TYPES = {
  'image/*': [],
  'application/pdf': [],
  'text/plain': [],
  'audio/*': [],
  'video/*': [],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
  'application/msword': []
};

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function DropZone({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const userTier = user?.tier || 'lite';

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // 1. Basic error handling for size/type
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((err) => {
        if (err.code === 'file-too-large') {
          toast.error(`"${file.name}" exceeds ${MAX_SIZE_MB}MB limit.`);
        } else {
          toast.error(`"${file.name}" could not be processed.`);
        }
      });
    });

    if (!acceptedFiles.length) return;

    // 2. Safety & Paywall Validation Logic
    for (const file of acceptedFiles) {
      // ─── A. Safety Check (18+ Content) ──────────────────────────────────────
      const sensitiveKeywords = ['adult', '18+', 'nsfw', 'porn', 'xxx', 'sexy', 'nude'];
      const fileNameLower = file.name.toLowerCase();
      const isSensitive = sensitiveKeywords.some(kw => fileNameLower.includes(kw.toLowerCase()));

      if (isSensitive) {
        console.warn(`Safety Guard: Blocked attempt to upload sensitive file - ${file.name}`);
        if (window.triggerSafetyGuard) {
          window.triggerSafetyGuard();
        } else {
          toast.error('Restricted content detected. Upload blocked.');
        }
        return; // Stop processing entirely
      }

      // ─── B. Paywall Logic (Applies to all Roles, including Admins) ──────────
      let restricted = false;
      let requiredTier = '';
      
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');

      if (user.role !== 'admin') {
        if (isAudio && userTier === 'lite') {
          restricted = true;
          requiredTier = 'Nest Plus';
        } else if (isVideo && (userTier === 'lite' || userTier === 'plus')) {
          restricted = true;
          requiredTier = 'Nest Pro';
        }
      }

      if (restricted) {
        const adminNote = user.role === 'admin' ? ' (Admin restriction applies)' : '';
        toast.error(`${requiredTier} required for ${isAudio ? 'Audio' : 'Video'}${adminNote}. Upgrade needed.`, { 
          duration: 5000,
          style: { border: '1px solid #ef4444' }
        });
        setTimeout(() => navigate('/pricing'), 2000);
        return; // Stop the loop
      }

      // 3. Perform Upload
      setCurrentFile(file.name);
      setProgress(0);
      setUploading(true);

      try {
        await uploadFile(file, (pct) => setProgress(pct));
        toast.success(`"${file.name}" uploaded successfully! 🎉`);
        if (onUploadSuccess) onUploadSuccess();
      } catch (err) {
        const msg = err.response?.data?.message;
        if (msg && msg.startsWith('UPGRADE_REQUIRED:')) {
            const tier = msg.split(':')[1];
            toast.error(`${tier} required. Redirecting...`);
            setTimeout(() => navigate('/pricing'), 2000);
        } else {
            toast.error(err.response?.data?.message || `Failed to upload "${file.name}"`);
        }
      }
    }

    setUploading(false);
    setCurrentFile(null);
    setProgress(0);
  }, [onUploadSuccess, userTier, navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
    disabled: uploading,
  });

  return (
    <div className="dropzone-wrapper">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="dropzone-icon">
          {isDragActive
            ? <Zap size={32} color="white" />
            : <CloudUpload size={32} color="white" />
          }
        </div>

        <p className="dropzone-title">
          {isDragActive ? 'Drop your files here!' : 'Drag & drop files here'}
        </p>
        <p className="dropzone-subtitle">
          or click to browse files from your computer
        </p>

        <div className="dropzone-meta">
          <span className="dropzone-tag">
            <FileImage size={12} /> Images
          </span>
          <span className="dropzone-tag">
            <FileText size={12} /> PDFs
          </span>
          <span className="dropzone-tag" style={{ border: userTier === 'lite' ? '1px dashed #ef4444' : '' }}>
            <Music size={12} /> Audio {userTier === 'lite' && '(Plus)'}
          </span>
          <span className="dropzone-tag" style={{ border: userTier !== 'pro' ? '1px dashed #ef4444' : '' }}>
            <Video size={12} /> Video {userTier !== 'pro' && '(Pro)'}
          </span>
        </div>
      </div>

      {uploading && (
        <UploadProgress fileName={currentFile} progress={progress} />
      )}
    </div>
  );
}
