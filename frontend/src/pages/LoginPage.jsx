import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User as UserIcon, Shield, Cloud, Key, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { login, verifyPin } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import ChatBot from '../components/Common/ChatBot';

export default function LoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [loginMode, setLoginMode] = useState('user');
  const [step, setStep]           = useState(1); // 1: Login, 2: PIN
  const [userId, setUserId]       = useState(null);
  const [digits, setDigits]       = useState(['', '', '', '', '', '']); // 6 boxes
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [locked, setLocked]       = useState(false);
  const [lockMsg, setLockMsg]     = useState('');
  const digitRefs                 = useRef([]);
  
  const [form, setForm]         = useState({ email: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Live validation
  const validate = () => {
    const e = {};
    if (!form.email)                    e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)                 e.password = 'Password is required';
    return e;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      const res = await login(form);
      const data = res.data;

      // Check if 2FA PIN is required
      if (data.requiresPin) {
        setUserId(data.userId);
        setStep(2);
        toast.success('Administrator Security Check Required');
        setLoading(false);
        return;
      }

      const user = data.user;

      // 1. Administrator Mode Check: Only admins allowed
      if (loginMode === 'admin' && user.role !== 'admin') {
        toast.error('Access Denied: Standard users must use the Standard Portal.');
        setLoading(false);
        return;
      }

      // 2. Standard User Mode Check: Admins NOT allowed
      if (loginMode === 'user' && user.role === 'admin') {
        toast.error('Access Denied: Administrators must use the Administrator Portal.');
        setLoading(false);
        return;
      }

      loginUser(data.token, user);
      toast.success(`Welcome back, ${user.name}! 👋`);
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed. Try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index, value) => {
    // Allow only single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    // Auto-advance
    if (digit && index < 5) digitRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const newDigits = [...digits];
      if (digits[index]) {
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        newDigits[index - 1] = '';
        setDigits(newDigits);
        digitRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = ['', '', '', '', '', ''];
    text.split('').forEach((ch, i) => { newDigits[i] = ch; });
    setDigits(newDigits);
    const focusIdx = Math.min(text.length, 5);
    digitRefs.current[focusIdx]?.focus();
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    const pin = digits.join('');
    if (pin.length !== 6) return;

    setLoading(true);
    try {
      const res = await verifyPin({ userId, pin });
      loginUser(res.data.token, res.data.user);
      toast.success(`Identity Verified. Welcome, ${res.data.user.name}!`);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.locked) {
        setLocked(true);
        setLockMsg(data.message);
      } else {
        setAttemptsLeft(data?.attemptsRemaining ?? null);
        toast.error(data?.message || 'Invalid PIN. Please try again.');
        // Clear boxes on wrong attempt
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => digitRefs.current[0]?.focus(), 50);
      }
    } finally {
      setLoading(false);
    }
  };

  const pinComplete = digits.every(d => d !== '');

  // Auto-focus first box when PIN modal opens
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => digitRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  return (
    <div className="auth-page">
      {/* Animated Clouds Backdrop */}
      <div className="cloud-bg">
        <div className="cloud" style={{ top: '10%', left: '10%', width: '200px', height: '100px', animationDelay: '0s' }}></div>
        <div className="cloud" style={{ top: '30%', left: '40', width: '300px', height: '150px', animationDelay: '-20s' }}></div>
        <div className="cloud" style={{ top: '60%', left: '20%', width: '250px', height: '120px', animationDelay: '-40s' }}></div>
      </div>

      <div className={`auth-card glass ${step === 2 ? 'blurred' : ''}`} style={{ transition: 'all 0.4s ease' }}>
        {/* Animated Brand Header */}
        <div className="bird-nest-container">
           <div className="nest-icon">
                <div className="bird-icon">
                 <Cloud size={32} color={loginMode === 'admin' ? 'var(--accent-purple)' : 'var(--accent-cyan)'} />
              </div>
           </div>
        </div>

        <div className="auth-header">
           <h1 className="text-gradient" style={{ letterSpacing: 'var(--ls-tighter)' }}>
             {loginMode === 'admin' ? 'Admin Portal' : 'Welcome Back'}
           </h1>
           <p>Sign in to your {loginMode === 'admin' ? 'management center' : 'cloud nest'}</p>
        </div>

        {/* Access Toggle */}
        <div className="login-toggle">
          <button 
            className={`toggle-btn user ${loginMode === 'user' ? 'active' : ''}`}
            onClick={() => setLoginMode('user')}
          >
            <UserIcon size={14} /> Standard User
          </button>
          <button 
            className={`toggle-btn admin ${loginMode === 'admin' ? 'active' : ''}`}
            onClick={() => setLoginMode('admin')}
          >
            <Shield size={14} /> Administrator
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                name="email"
                className="form-input"
                placeholder="you@cloudnest.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              <Mail size={16} className="input-icon" />
            </div>
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ paddingRight: '42px' }}
              />
              <Lock size={16} className="input-icon" />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ background: loginMode === 'admin' ? 'var(--accent-purple)' : 'var(--accent-cyan)' }}
            disabled={loading}
          >
            {loading ? <span className="loader" style={{ width: 18, height: 18, borderWidth: 2 }} /> : `Enter ${loginMode === 'admin' ? 'Portal' : 'CloudNest'}`}
          </button>
        </form>

        <p className="auth-link" style={{ fontSize: '0.75rem', marginTop: '24px', opacity: 0.6 }}>
          Contact your administrator for account requests.
        </p>
        <span className="text-gradient">CloudNest</span>
      </div>

      {/* Security PIN Modal */}
      {step === 2 && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px', padding: '40px' }}>
            <div className="modal-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)' }}>
               <Key size={24} />
            </div>
            <h3 className="modal-title">Admin Security PIN</h3>

            {locked ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <AlertTriangle size={32} style={{ color: 'var(--accent-pink)', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--accent-pink)', fontSize: '0.85rem', lineHeight: 1.6 }}>{lockMsg}</p>
                <button type="button" className="btn btn-ghost" style={{ marginTop: '20px', fontSize: '0.8rem' }} onClick={() => setStep(1)}>Back to Login</button>
              </div>
            ) : (
              <>
                <p className="modal-text" style={{ marginBottom: '8px' }}>Enter your 6-digit Security PIN to verify your identity.</p>
                {attemptsLeft !== null && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', marginBottom: '8px', fontWeight: 600 }}>
                    ⚠️ {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before lockout
                  </p>
                )}

                <form onSubmit={handleVerifyPin}>
                  {/* 6-Box OTP Input */}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '28px 0 32px' }}>
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={el => digitRefs.current[i] = el}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]"
                        maxLength={1}
                        value={d}
                        onChange={e => handleDigitChange(i, e.target.value)}
                        onKeyDown={e => handleDigitKeyDown(i, e)}
                        onPaste={handleDigitPaste}
                        style={{
                          width: '48px',
                          height: '58px',
                          textAlign: 'center',
                          fontSize: d ? '1.6rem' : '1.4rem',
                          fontWeight: 700,
                          borderRadius: '10px',
                          border: d ? '2px solid var(--accent-purple)' : '2px solid rgba(139,92,246,0.25)',
                          background: d ? 'rgba(139,92,246,0.1)' : 'var(--bg-app)',
                          color: 'transparent',
                          textShadow: d ? '0 0 0 var(--text-primary)' : 'none',
                          outline: 'none',
                          transition: 'all 0.15s ease',
                          boxShadow: d ? '0 0 0 3px rgba(139,92,246,0.2)' : 'none',
                          caretColor: 'transparent',
                          cursor: 'text',
                          WebkitUserSelect: 'none',
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ background: 'var(--accent-purple)' }}
                      disabled={loading || !pinComplete}
                    >
                      {loading ? <span className="loader" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Verify Identity'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-ghost"
                      onClick={() => { setStep(1); setDigits(['','','','','','']); setAttemptsLeft(null); }}
                      style={{ fontSize: '0.8rem' }}
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      <ChatBot />
    </div>
  );
}
