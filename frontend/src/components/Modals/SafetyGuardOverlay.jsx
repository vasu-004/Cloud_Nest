import { ShieldAlert, Info, XCircle } from 'lucide-react';

export default function SafetyGuardOverlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.95)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backdropFilter: 'blur(10px)'
    }}>
      <div className="widget" style={{
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        background: '#0f172a',
        border: '2px solid #ef4444',
        padding: '40px',
        boxShadow: '0 0 50px rgba(239, 68, 68, 0.2)'
      }}>
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <ShieldAlert size={48} color="#ef4444" />
        </div>

        <h1 style={{ color: '#ef4444', fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>
          CONTENT BLOCKED
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '32px' }}>
          Our AI-powered <b>Safety Guard</b> has detected restricted or 18+ content in your upload request. 
          CloudNest strictly prohibits the storage of explicit material to maintain a secure and professional environment.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          textAlign: 'left'
        }}>
          <Info size={20} color="var(--accent-cyan)" style={{ marginTop: '2px' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Repeated attempts to upload restricted material may lead to temporary account suspension. Please review our safety guidelines in the settings.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={onClose}
          style={{
            width: '100%',
            background: '#ef4444',
            color: 'white',
            fontWeight: 700,
            border: 'none',
            fontSize: '1rem'
          }}
        >
          I Understand & Acknowledge
        </button>
      </div>
    </div>
  );
}
