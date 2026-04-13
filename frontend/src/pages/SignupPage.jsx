// src/pages/SignupPage.jsx - New user registration page
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Cloud, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { signup } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())          e.name = 'Name is required';
    if (!form.email)                e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)             e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }

    setLoading(true);
    try {
      const res = await signup({ name: form.name, email: form.email, password: form.password });
      loginUser(res.data.token, res.data.user);
      toast.success(`Account created! Welcome, ${res.data.user.name}! 🎉`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-header">
           <div className="auth-logo">CloudNest</div>
           <h1>Create Account</h1>
           <p>Join CloudNest and start storing securely</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <input
                id="name" type="text" name="name"
                className="form-input" placeholder="Jane Doe"
                value={form.name} onChange={handleChange} autoComplete="name"
              />
              <User size={16} className="input-icon" />
            </div>
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-wrapper">
              <input
                id="email" type="email" name="email"
                className="form-input" placeholder="you@example.com"
                value={form.email} onChange={handleChange} autoComplete="email"
              />
              <Mail size={16} className="input-icon" />
            </div>
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                id="password" name="password"
                type={showPass ? 'text' : 'password'}
                className="form-input" placeholder="Min 6 characters"
                value={form.password} onChange={handleChange}
                autoComplete="new-password" style={{ paddingRight: '42px' }}
              />
              <Lock size={16} className="input-icon" />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                style={{ position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirm Password</label>
            <div className="input-wrapper">
              <input
                id="confirm" name="confirm"
                type={showPass ? 'text' : 'password'}
                className="form-input" placeholder="Re-enter your password"
                value={form.confirm} onChange={handleChange}
                autoComplete="new-password"
              />
              <Lock size={16} className="input-icon" />
            </div>
            {errors.confirm && <p className="form-error">{errors.confirm}</p>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? <><span className="loader" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account…</>
              : 'Create Account'
            }
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
