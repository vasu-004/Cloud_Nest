// src/components/FileUpload/FileList.jsx - Grid of uploaded file cards
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Download, Trash2, FileText, Calendar, HardDrive, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteFile } from '../../services/fileService';

// ─── File type helpers ────────────────────────────────────────────────────────
const isImage = (mimeType) => mimeType?.startsWith('image/');
const isPDF   = (mimeType) => mimeType === 'application/pdf';

const getTypeBadge = (mimeType) => {
  if (isPDF(mimeType))   return { label: 'PDF',   cls: 'badge-pdf' };
  if (isImage(mimeType)) return { label: 'Image', cls: 'badge-img' };
  return { label: 'File', cls: 'badge-default' };
};

// Format ISO date to readable string
const formatDate = (iso) => {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteModal({ file, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">
          <AlertTriangle size={26} />
        </div>
        <h3 className="modal-title">Delete File?</h3>
        <p className="modal-text">
          <strong>"{file.originalName}"</strong> will be permanently removed from
          S3 and cannot be recovered.
        </p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            <X size={15} /> Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : <><Trash2 size={15} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Single file card ─────────────────────────────────────────────────────────
function FileCard({ file, onDeleted }) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  const canDelete = ['admin', 'editor'].includes(user?.role);
  const canDownload = ['admin', 'editor', 'downloader', 'viewer'].includes(user?.role);

  const badge = getTypeBadge(file.mimeType);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFile(file._id);
      toast.success('File deleted successfully.');
      onDeleted(file._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete file.');
    } finally {
      setDeleting(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <div className="file-card">
        {/* Preview: show image thumbnail or PDF placeholder */}
        {isImage(file.mimeType) ? (
          <img
            src={file.url}
            alt={file.originalName}
            className="file-card-preview"
            loading="lazy"
          />
        ) : (
          <div className="file-card-preview-placeholder">
            <FileText size={40} color="var(--text-muted)" />
            <span className={`file-type-badge ${badge.cls}`}>{badge.label}</span>
          </div>
        )}

        <div className="file-card-body">
          {/* File name */}
          <p className="file-card-name" title={file.originalName}>
            {file.originalName}
          </p>

          {/* Meta: size + date */}
          <div className="file-card-meta">
            <span><HardDrive size={11} /> {file.sizeFormatted}</span>
            <span><Calendar size={11} /> {formatDate(file.createdAt)}</span>
            <span className={`file-type-badge ${badge.cls}`}>{badge.label}</span>
          </div>

          {/* Actions */}
          <div className="file-card-actions">
            {/* Download */}
            {canDownload && (
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                download={file.originalName}
                className="btn btn-success btn-sm"
                style={{ flex: 1 }}
              >
                <Download size={14} /> Download
              </a>
            )}

            {/* Delete */}
            {canDelete && (
              <button
                className="btn btn-danger btn-icon"
                onClick={() => setShowModal(true)}
                title="Delete file"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {showModal && (
        <DeleteModal
          file={file}
          onConfirm={handleDelete}
          onCancel={() => setShowModal(false)}
          loading={deleting}
        />
      )}
    </>
  );
}

// ─── File List ────────────────────────────────────────────────────────────────
export default function FileList({ files, setFiles, loading }) {
  const handleDeleted = (deletedId) => {
    setFiles((prev) => prev.filter((f) => f._id !== deletedId));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
        <span className="loader" />
        <p style={{ marginTop: '16px', fontSize: '0.9rem' }}>Loading your files…</p>
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <FileText size={36} />
        </div>
        <h3 className="empty-state-title">No files yet</h3>
        <p className="empty-state-text">
          Upload your first file using the drop zone above.
        </p>
      </div>
    );
  }

  return (
    <div className="files-grid">
      {files.map((file) => (
        <FileCard key={file._id} file={file} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}
