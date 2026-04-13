import MainLayout from '../components/Layout/MainLayout';
import { Check, Zap, Crown, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import PaymentModal from '../components/Pricing/PaymentModal';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Nest Lite',
      price: 'Free',
      description: 'Perfect for small documents and photos.',
      features: ['50GB Storage', 'Images & PDFs', 'Standard Support'],
      buttonText: 'Current Plan',
      current: true,
      color: 'var(--text-secondary)'
    },
    {
      name: 'Nest Plus',
      price: '₹999',
      description: 'Unlock audio storage and more space.',
      features: ['2TB Storage', 'Everything in Lite', 'Audio Files Support', 'Priority Support'],
      buttonText: 'Upgrade to Plus',
      popular: true,
      color: 'var(--accent-cyan)'
    },
    {
      name: 'Nest Pro',
      price: '₹4999',
      description: 'The ultimate cloud for power users.',
      features: ['10TB Storage', 'Everything in Plus', 'Full Video Support', 'Encrypted Vaults', '24/7 Support'],
      buttonText: 'Go Pro',
      color: '#8b5cf6'
    }
  ];

  const [selectedTier, setSelectedTier] = useState(null);

  const handleUpgrade = (tier) => {
    if (tier.name === 'Nest Lite') return;
    setSelectedTier(tier);
  };

  return (
    <MainLayout title="Pricing Plans">
      <div className="welcome-text">
        Choose Your <span>Plan</span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400, marginTop: '4px' }}>
          Upgrade your CloudNest experience and unlock more file formats.
        </p>
      </div>

      <div className="pricing-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginTop: '32px'
      }}>
        {tiers.map((tier) => (
          <div key={tier.name} className="widget" style={{
            position: 'relative',
            border: tier.popular ? `1px solid ${tier.color}` : '1px solid var(--border-color)',
            background: tier.popular ? 'linear-gradient(145deg, var(--bg-card), #162444)' : 'var(--bg-card)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.3s ease'
          }}>
            {tier.popular && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '20px',
                background: tier.color,
                color: 'black',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '20px',
                textTransform: 'uppercase'
              }}>
                Recommended
              </div>
            )}
            
            <div className="pricing-header" style={{ marginBottom: '24px' }}>
              <div style={{ color: tier.color, marginBottom: '8px' }}>
                {tier.name === 'Nest Pro' ? <Crown size={32} /> : tier.popular ? <Zap size={32} fill={tier.color} /> : <ShieldCheck size={32} />}
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{tier.name}</h2>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
                {tier.price} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ year</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tier.description}</p>
            </div>

            <div className="pricing-features" style={{ flex: 1, marginBottom: '32px' }}>
              {tier.features.map(feat => (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '0.85rem' }}>
                  <Check size={16} color={tier.color} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <button 
              className={`btn ${tier.current ? 'btn-secondary' : 'btn-primary'}`}
              disabled={tier.current}
              onClick={() => handleUpgrade(tier)}
              style={{
                width: '100%',
                background: tier.current ? 'rgba(255,255,255,0.05)' : tier.popular ? tier.color : '',
                color: tier.popular ? 'black' : '',
                fontWeight: 700
              }}
            >
              {tier.buttonText}
            </button>
          </div>
        ))}
      </div>

      {selectedTier && (
        <PaymentModal 
          tier={selectedTier} 
          onClose={() => setSelectedTier(null)} 
        />
      )}
    </MainLayout>
  );
}
