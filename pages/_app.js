// pages/_app.js
import '../styles/globals.css';
import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Link from 'next/link';

function MyApp({ Component, pageProps }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">Bitcoin Signal Analyzer</div>

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>

          <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/rewards">Rewards</Link></li>
          </ul>
        </div>
      </nav>

      <main className="main-content">
        <Component {...pageProps} />
        <Link href="/rewards" className="floating-btn">Claim Rewards</Link>
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} Bitcoin Signal Analyzer |
        <Link href="/rewards" style={{ marginLeft: '8px', textDecoration: 'underline' }}>Claim Rewards</Link>
      </footer>

      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default MyApp;
