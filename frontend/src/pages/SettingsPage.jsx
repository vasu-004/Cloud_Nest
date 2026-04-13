import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Bell, Globe, Phone, Save, Lock, CheckCircle, XCircle } from 'lucide-react';
import { getProfile, updateProfile } from '../services/userService';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, loginUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: '',
    preferences: {
      emailNotifications: true,
      storageAlerts: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPin, setNewPin]         = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savingPin, setSavingPin]   = useState(false);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode]           = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent]           = useState(false);


  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getProfile();
        const p = res.data.data;
        setFormData({
          name: p.name || '',
          phone: p.phone || '',
          avatar: p.avatar || '',
          preferences: p.preferences || { emailNotifications: true, storageAlerts: true }
        });
      } catch (err) {
        toast.error('Failed to load profile settings');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile({ 
        ...formData, 
        role: 'admin', 
        tier: 'pro' 
      });
      toast.success('Settings updated & Admin Privileges Granted! 👑');
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key) => {
    const newPrefs = { ...formData.preferences, [key]: !formData.preferences[key] };
    setFormData(prev => ({ ...prev, preferences: newPrefs }));
    updateProfile({ preferences: newPrefs }).catch(err => toast.error(err.response?.data?.message || 'Failed to save preference'));
  };

  const pinMatch = newPin.length === 6 && confirmPin.length === 6 && newPin === confirmPin;
  const pinMismatch = confirmPin.length === 6 && newPin !== confirmPin;

  const handleSavePin = async () => {
    if (!pinMatch) return;
    setSavingPin(true);
    try {
      const { updatePin } = await import('../services/authService');
      await updatePin({ pin: newPin });
      toast.success('Security PIN updated successfully! 🔐');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update PIN');
    } finally {
      setSavingPin(false);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.phone) return toast.error('Please enter a phone number first');
    setSaving(true);
    try {
      const { sendOTP } = await import('../services/authService');
      await sendOTP({ phone: formData.phone });
      setOtpSent(true);
      setShowOtpModal(true);
      toast.success('OTP sent to ' + formData.phone);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setVerifyingOtp(true);
    try {
      const { verifyOTP } = await import('../services/authService');
      await verifyOTP({ phone: formData.phone, otp: otpCode });
      setShowOtpModal(false);
      setOtpSent(false);
      setOtpCode('');
      toast.success('Phone number verified successfully! ✅');
      // Refresh user data
      const res = await getProfile();
      loginUser(null, res.data.data); // Refresh context
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };


  if (loading) return (
    <MainLayout title="Settings">
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading settings...</div>
    </MainLayout>
  );

  if (user?.role !== 'admin') return (
    <MainLayout title="Settings">
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
        <Shield size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
        <h3>Access Denied</h3>
        <p style={{ marginTop: '8px' }}>Only Administrators can access and modify settings.</p>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout title="Settings">
      <div className="welcome-text">
        Account <span>Settings</span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '4px' }}>
          Update your profile, change your preferences, and manage security.
        </p>
      </div>

      <div className="dash-layout">
        <div className="main-column">
          <div className="widget">
            <div className="widget-header">
              <div className="widget-title">General Information</div>
              <button 
                className="btn btn-sm btn-primary" 
                style={{ width: 'auto', gap: '6px' }} 
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '24px', marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                {formData.avatar ? (
                  <img 
                    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${formData.avatar}`} 
                    style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--accent-cyan)' }} 
                    alt="avatar" 
                  />
                ) : (
                  <div style={{ 
                    width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-widget)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '1.5rem', border: '2px solid var(--accent-cyan)',
                    color: 'var(--accent-cyan)', fontWeight: 800
                  }}>
                    {formData.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{formData.name || 'Demo User'}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {user?.tier?.toUpperCase()} Account • Admin
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto', justifyContent: 'flex-end' }}>
                  {['Felix', 'Aneka', 'Jocelyn', 'Max', 'Luna', 'Jack'].map(seed => (
                    <img 
                      key={seed} 
                      src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`} 
                      style={{ 
                        width: 42, height: 42, borderRadius: '50%', cursor: 'pointer',
                        border: formData.avatar === seed ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                        background: 'rgba(255,255,255,0.05)',
                        transition: 'all 0.2s',
                        opacity: formData.avatar && formData.avatar !== seed ? 0.6 : 1
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, avatar: seed }))}
                      alt={seed}
                      title={`Select ${seed}`}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Full Name</label>
                    <div className="input-wrapper">
                      <User className="input-icon" size={16} style={{ left: '12px', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ paddingLeft: '38px', background: 'var(--bg-widget)' }}
                        value={formData.name} 
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Email Address</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" size={16} style={{ left: '12px', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="email" 
                        className="form-input" 
                        style={{ paddingLeft: '38px', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}
                        value={user?.email} 
                        disabled 
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>Phone Number</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div className="input-wrapper" style={{ flex: 1 }}>
                        <Phone className="input-icon" size={16} style={{ left: '12px', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ paddingLeft: '38px', background: 'var(--bg-widget)' }}
                          placeholder="+91 6379015850"
                          value={formData.phone} 
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <button 
                        className="btn btn-secondary" 
                        style={{ width: 'auto', whiteSpace: 'nowrap', padding: '0 20px', gap: '8px' }}
                        onClick={handleSendOtp}
                        disabled={saving || !formData.phone}
                      >
                        <Shield size={14} /> Verify Phone
                      </button>
                    </div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Verification is required for 2FA and security alerts.
                    </p>
                  </div>
              </div>
            </div>
          </div>


        </div>

        <div className="side-column">
           <div className="widget">
             <div className="widget-title" style={{ marginBottom: '16px' }}>Preferences</div>
             <div style={{ display: 'grid', gap: '16px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email Notifications</span>
                  <input 
                    type="checkbox" 
                    checked={formData.preferences.emailNotifications} 
                    onChange={() => handlePreferenceChange('emailNotifications')}
                  />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Storage Alerts</span>
                  <input 
                    type="checkbox" 
                    checked={formData.preferences.storageAlerts} 
                    onChange={() => handlePreferenceChange('storageAlerts')}
                  />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dark Theme</span>
                  <input type="checkbox" checked disabled />
                </label>
             </div>
           </div>

           <div className="widget" style={{ marginTop: '24px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-purple)', marginBottom: '16px' }}>
                <Lock size={18} />
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Security PIN</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Set a <strong>6-digit PIN</strong> to secure your Admin Portal. It is hashed and never stored in plain text.
              </p>

              {/* New PIN */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>New PIN</label>
                <input 
                  type="password"
                  inputMode="numeric"
                  maxLength="6"
                  className="form-input"
                  placeholder="••••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '1.1rem', background: 'var(--bg-widget)' }}
                />
              </div>

              {/* Confirm PIN */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confirm PIN</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password"
                    inputMode="numeric"
                    maxLength="6"
                    className="form-input"
                    placeholder="••••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    style={{ 
                      textAlign: 'center', letterSpacing: '6px', fontSize: '1.1rem', 
                      background: 'var(--bg-widget)',
                      border: confirmPin.length === 6 ? `2px solid ${pinMatch ? 'var(--accent-cyan)' : 'var(--accent-pink)'}` : undefined
                    }}
                  />
                  {confirmPin.length === 6 && (
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                      {pinMatch 
                        ? <CheckCircle size={16} color="var(--accent-cyan)" /> 
                        : <XCircle size={16} color="var(--accent-pink)" />}
                    </span>
                  )}
                </div>
                {pinMismatch && <p style={{ fontSize: '0.7rem', color: 'var(--accent-pink)', marginTop: '4px' }}>PINs do not match</p>}
              </div>

              <button
                onClick={handleSavePin}
                disabled={!pinMatch || savingPin}
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  background: pinMatch ? 'var(--accent-purple)' : 'rgba(139,92,246,0.2)',
                  transition: 'background 0.2s'
                }}
              >
                {savingPin ? <span className="loader" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '🔐 Save Security PIN'}
              </button>
           </div>

           <div className="widget" style={{ marginTop: '24px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05), transparent)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
               <Shield size={20} />
               <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>CloudNest Protect</span>
             </div>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
               Your data is encrypted end-to-end and stored in your preferred location.
             </p>
           </div>
        </div>
      </div>



      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px', padding: '40px' }}>
            <div className="modal-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)' }}>
               <Shield size={24} />
            </div>
            <h3 className="modal-title">Enter Verification Code</h3>
            <p className="modal-text" style={{ marginBottom: '24px' }}>
              A 6-digit code has been sent to <strong>{formData.phone}</strong>. Enter it below to verify your phone number.
            </p>

            <div className="form-group" style={{ marginBottom: '32px' }}>
              <input
                type="text"
                maxLength="6"
                className="form-input"
                style={{ 
                  textAlign: 'center', 
                  fontSize: '2rem', 
                  letterSpacing: '12px', 
                  paddingLeft: '14px',
                  height: '64px',
                  background: 'var(--bg-app)',
                  border: '2px solid rgba(6, 182, 212, 0.3)'
                }}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--accent-cyan)' }}
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otpCode.length !== 6}
              >
                {verifyingOtp ? <span className="loader" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Verify & Close'}
              </button>
              <button 
                className="btn btn-ghost"
                onClick={() => setShowOtpModal(false)}
                style={{ fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            </div>
            
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '24px', textAlign: 'center' }}>
              Didn't receive the code? Check the console (log) or try again in 1 minute.
            </p>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
