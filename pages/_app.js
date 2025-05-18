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
      {/* Sticky Nav */}
      <nav className="bg-gray-900 text-white px-6 py-4 shadow-md sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">Bitcoin Signal Analyzer</div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-6 text-sm font-medium">
            <Link href="/" className="hover:text-yellow-400 transition">Home</Link>
            <Link href="/rewards" className="hover:text-yellow-400 transition">Rewards</Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="focus:outline-none"
              aria-label="Toggle Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="mt-2 flex flex-col space-y-2 md:hidden">
            <Link href="/" className="block text-sm hover:text-yellow-400 transition">Home</Link>
            <Link href="/rewards" className="block text-sm hover:text-yellow-400 transition">Rewards</Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="min-h-screen bg-white text-gray-900 px-4 py-6 relative">
        <Component {...pageProps} />

        {/* Floating Claim Button */}
        <Link
          href="/rewards"
          className="fixed bottom-6 right-6 bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-3 rounded-full shadow-lg transition duration-300 z-50"
        >
          Claim Rewards
        </Link>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-4 text-center text-sm">
        <p>
          © {new Date().getFullYear()} Bitcoin Signal Analyzer.
          <Link href="/rewards" className="ml-2 underline hover:text-yellow-400">Claim Rewards</Link>
        </p>
      </footer>

      {/* Metrics */}
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default MyApp;
