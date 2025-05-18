import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Link from 'next/link';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <nav style={{
        padding: '1rem',
        backgroundColor: '#000',
        color: '#fff',
        display: 'flex',
        gap: '1rem'
      }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>
          Home
        </Link>
        <Link href="/rewards" style={{ color: '#fff', textDecoration: 'none' }}>
          Rewards
        </Link>
      </nav>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default MyApp;
