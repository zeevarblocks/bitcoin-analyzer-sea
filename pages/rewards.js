import Link from 'next/link';

export default function Rewards() {
  return (
    <div
      style={{
        padding: '2rem',
        minHeight: '100vh',
        background: "url('/background.jpg') no-repeat center center fixed",
        backgroundSize: 'cover',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: '2rem',
          borderRadius: '16px',
          color: 'white',
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          Claim Your Binance Mystery Box
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          Celebrate Pizza Day 2025 with Binance and claim your exclusive reward through our referral link.
        </p>
        <a
          href="https://www.binance.com/referral/mystery-box/2025-pizza-day/claim?ref=GRO_16987_LRM2A"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: '#f3ba2f',
            color: '#000',
            padding: '1rem 2rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1.1rem',
          }}
        >
          Claim Your Mystery Box
        </a>
        <div style={{ marginTop: '3rem' }}>
          <Link href="/">
            <a style={{ color: '#4fc3f7', textDecoration: 'underline' }}>Back to Home</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
