// src/components/FileUpload/UploadProgress.jsx - Upload progress bar card
import { Loader2 } from 'lucide-react';

export default function UploadProgress({ fileName, progress }) {
  return (
    <div className="upload-progress-card">
      <div className="upload-progress-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Animated spinner */}
          <Loader2 size={16} color="var(--accent-light)" style={{ animation: 'spin 0.8s linear infinite' }} />
          <span className="upload-progress-name">{fileName}</span>
        </div>
        <span className="upload-progress-percent">{progress}%</span>
      </div>

      {/* Progress track + fill */}
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {progress === 100 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '8px', textAlign: 'center' }}>
          ✓ Processing…
        </p>
      )}
    </div>
  );
}
