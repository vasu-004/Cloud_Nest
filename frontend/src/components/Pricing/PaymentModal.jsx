// src/components/Pricing/PaymentModal.jsx
import { useState } from 'react';
import { CreditCard, ShieldCheck, X, CheckCircle, Loader2 } from 'lucide-react';
import { checkout } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function PaymentModal({ tier, onClose, onDashboardUpdate }) {
  const { user, loginUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: ''
  });

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await checkout({
        tier: tier.name.toLowerCase().replace('nest ', ''),
        cardLastFour: cardData.number.slice(-4),
        amount: tier.price
      });

      setSuccess(true);
      // Update global user state with new tier
      const updatedUser = { ...user, tier: res.data.tier };
      loginUser(localStorage.getItem('token'), updatedUser);
      
      toast.success(`Welcome to ${tier.name}! 🚀`);
      
      // Close after delay
      setTimeout(() => {
        onClose();
        if (onDashboardUpdate) onDashboardUpdate();
        window.location.reload(); // Hard refresh to ensure all global components catch the change
      }, 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed. Please check card details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
       <div className="modal-card" style={{ maxWidth: '440px', padding: '0', overflow: 'hidden' }}>
          
          <div style={{ background: 'var(--bg-widget)', padding: '24px', borderBottom: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Checkout</h3>
                <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
             </div>
             <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
               Secure payment for your {tier.name} subscription.
             </p>
          </div>

          <div style={{ padding: '24px' }}>
             {success ? (
               <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                     <CheckCircle size={40} />
                  </div>
                  <h4 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Payment Success!</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Your account has been upgraded to <strong>{tier.name}</strong>.
                    Refreshing your workspace...
                  </p>
               </div>
             ) : (
               <form onSubmit={handlePay}>
                  <div className="widget" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', marginBottom: '24px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Selected Plan</span>
                        <span style={{ fontWeight: 700 }}>{tier.name}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Due</span>
                        <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{tier.price}</span>
                     </div>
                  </div>

                  <div className="form-group">
                     <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>CARD NUMBER</label>
                     <div className="input-wrapper">
                        <CreditCard className="input-icon" size={16} />
                        <input 
                           type="text" 
                           className="form-input" 
                           placeholder="4242 4242 4242 4242"
                           maxLength="19"
                           required
                           value={cardData.number}
                           onChange={e => setCardData({...cardData, number: e.target.value})}
                        />
                     </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                     <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>EXPIRY DATE</label>
                        <input 
                           type="text" 
                           className="form-input" 
                           placeholder="MM/YY"
                           style={{ paddingLeft: '14px' }}
                           maxLength="5"
                           required
                           value={cardData.expiry}
                           onChange={e => setCardData({...cardData, expiry: e.target.value})}
                        />
                     </div>
                     <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>CVV</label>
                        <input 
                           type="text" 
                           className="form-input" 
                           placeholder="123"
                           style={{ paddingLeft: '14px' }}
                           maxLength="3"
                           required
                           value={cardData.cvv}
                           onChange={e => setCardData({...cardData, cvv: e.target.value})}
                        />
                     </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ marginTop: '24px', height: '48px', gap: '10px' }}
                    disabled={loading}
                  >
                     {loading ? (
                       <><Loader2 className="loader" size={18} /> Processing...</>
                     ) : (
                       `Pay ${tier.price}`
                     )}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                     <ShieldCheck size={14} />
                     Secured and Encrypted by CloudNest Pay
                  </div>
               </form>
             )}
          </div>
       </div>
    </div>
  );
}
